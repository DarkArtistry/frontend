export interface CompileResult {
  success: boolean;
  contracts?: {
    [contractName: string]: {
      abi: Array<unknown>;
      bytecode: string;
      deployedBytecode: string;
    };
  };
  errors?: Array<{
    formattedMessage: string;
    severity: 'error' | 'warning';
    sourceLocation?: {
      file: string;
      start: number;
      end: number;
    };
  }>;
}

interface WorkerMessage {
  id: number;
  action: 'loadCompiler' | 'compile' | 'getVersions';
  data?: any;
}

interface WorkerResponse {
  id: number;
  success: boolean;
  result?: string | string[];
  error?: string;
}

export class WebWorkerSolidityCompiler {
  private static instance: WebWorkerSolidityCompiler;
  private worker: Worker | null = null;
  private requestId = 0;
  private pending = new Map<number, { resolve: (value: any) => void; reject: (error: Error) => void }>();
  private importCache = new Map<string, string>();
  private currentVersion: string = '0.8.26';
  private availableVersions: string[] = [];

  private constructor() {}

  static getInstance(): WebWorkerSolidityCompiler {
    if (!WebWorkerSolidityCompiler.instance) {
      WebWorkerSolidityCompiler.instance = new WebWorkerSolidityCompiler();
    }
    return WebWorkerSolidityCompiler.instance;
  }

  async getAvailableVersions(): Promise<string[]> {
    await this.initWorker();
    const versions = await this.sendMessage<string[]>('getVersions');
    this.availableVersions = versions;
    return versions;
  }

  async setCompilerVersion(version: string): Promise<void> {
    await this.initWorker();
    await this.sendMessage('loadCompiler', { version });
    this.currentVersion = version;
  }

  getCurrentVersion(): string {
    return this.currentVersion;
  }

  private async initWorker(): Promise<void> {
    if (this.worker) return;
    
    // Create worker - in Next.js, files in public directory are served from root
    if (typeof window !== 'undefined') {
      this.worker = new Worker('/solc-worker.js');
    } else {
      throw new Error('Web Workers are only supported in browser environment');
    }
    
    // Set up message handler
    this.worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
      const { id, success, result, error } = e.data;
      const pending = this.pending.get(id);
      if (!pending) return;
      
      this.pending.delete(id);
      if (success) {
        pending.resolve(result);
      } else {
        pending.reject(new Error(error || 'Unknown error'));
      }
    };
    
    // Set up error handler
    this.worker.onerror = (error) => {
      console.error('Worker error:', error);
      // Reject all pending requests
      this.pending.forEach(({ reject }) => {
        reject(new Error('Worker crashed'));
      });
      this.pending.clear();
    };
    
    // Load default compiler version
    await this.sendMessage('loadCompiler', { version: this.currentVersion });
  }

  private sendMessage<T = any>(action: WorkerMessage['action'], data?: any): Promise<T> {
    if (!this.worker) {
      throw new Error('Worker not initialized');
    }

    return new Promise((resolve, reject) => {
      const id = ++this.requestId;
      this.pending.set(id, { resolve, reject });
      
      const message: WorkerMessage = { id, action, data };
      this.worker!.postMessage(message);

      // Add timeout for safety
      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          reject(new Error(`Worker timeout for action: ${action}`));
        }
      }, 30000); // 30 second timeout
    });
  }

  private async resolveImport(path: string): Promise<{ contents?: string; error?: string }> {
    // Check cache first
    if (this.importCache.has(path)) {
      return { contents: this.importCache.get(path) };
    }

    try {
      let url = '';
      
      // Handle OpenZeppelin imports
      if (path.startsWith('@openzeppelin/contracts-upgradeable/')) {
        const contractPath = path.replace('@openzeppelin/contracts-upgradeable/', '');
        url = `https://raw.githubusercontent.com/OpenZeppelin/openzeppelin-contracts-upgradeable/v5.0.0/contracts/${contractPath}`;
      } else if (path.startsWith('@openzeppelin/contracts/')) {
        const contractPath = path.replace('@openzeppelin/contracts/', '');
        url = `https://raw.githubusercontent.com/OpenZeppelin/openzeppelin-contracts/v5.0.0/contracts/${contractPath}`;
      } else {
        return { error: `Unsupported import: ${path}` };
      }

      // Fetch the content with retry logic
      let response;
      let lastError;
      
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          response = await fetch(url);
          if (response.ok) break;
          lastError = `HTTP ${response.status}: ${response.statusText}`;
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        } catch (error) {
          lastError = `Network error: ${error}`;
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        }
      }

      if (!response || !response.ok) {
        return { error: `Failed to fetch ${path}: ${lastError}` };
      }

      const contents = await response.text();
      this.importCache.set(path, contents);
      return { contents };
    } catch (error) {
      return { error: `Error loading ${path}: ${error}` };
    }
  }

  async compile(sources: Record<string, string>): Promise<CompileResult> {
    await this.initWorker();
    
    // First, collect all imports and resolve them
    const allSources: Record<string, { content: string }> = {};
    const importQueue: string[] = [];
    const processedImports = new Set<string>();

    // Add initial sources
    for (const [fileName, content] of Object.entries(sources)) {
      allSources[fileName] = { content };
      const imports = this.extractImports(content);
      importQueue.push(...imports);
    }

    // Process import queue
    while (importQueue.length > 0) {
      const importPath = importQueue.shift()!;
      if (processedImports.has(importPath)) continue;
      processedImports.add(importPath);

      const result = await this.resolveImport(importPath);
      if (result.contents) {
        allSources[importPath] = { content: result.contents };
        const newImports = this.extractImports(result.contents);
        importQueue.push(...newImports);
      }
    }

    const input = {
      language: 'Solidity',
      sources: allSources,
      settings: {
        outputSelection: {
          '*': {
            '*': ['abi', 'evm.bytecode', 'evm.deployedBytecode', 'evm.methodIdentifiers'],
          },
        },
        optimizer: {
          enabled: true,
          runs: 200,
        },
        evmVersion: 'paris', // Latest stable EVM version
      },
    };

    interface CompilerOutput {
      errors?: Array<{
        formattedMessage: string;
        message?: string;
        severity: string;
        sourceLocation?: {
          file: string;
          start: number;
          end: number;
        };
      }>;
      contracts?: Record<string, Record<string, {
        abi: Array<unknown>;
        evm: {
          bytecode: { object: string };
          deployedBytecode: { object: string };
        };
      }>>;
    }

    try {
      const output = await this.sendMessage<string>('compile', { input: JSON.stringify(input) });
      const result = JSON.parse(output) as CompilerOutput;
      
      // Check for fatal errors
      const errors = result.errors || [];
      const hasErrors = errors.some((e) => e.severity === 'error');
      
      // Extract contracts
      const contracts: CompileResult['contracts'] = {};
      if (result.contracts && !hasErrors) {
        for (const [, sourceContracts] of Object.entries(result.contracts)) {
          for (const [contractName, contract] of Object.entries(sourceContracts)) {
            // Only add contracts with actual bytecode
            if (contract.evm.bytecode.object && contract.evm.bytecode.object !== '0x') {
              contracts[contractName] = {
                abi: contract.abi,
                bytecode: contract.evm.bytecode.object,
                deployedBytecode: contract.evm.deployedBytecode.object,
              };
            }
          }
        }
      }

      return {
        success: !hasErrors,
        contracts: hasErrors ? undefined : contracts,
        errors: errors.map((e) => ({
          formattedMessage: e.formattedMessage || e.message || 'Unknown error',
          severity: e.severity as 'error' | 'warning',
          sourceLocation: e.sourceLocation,
        })),
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        errors: [{
          formattedMessage: `Compilation failed: ${errorMessage}`,
          severity: 'error',
        }],
      };
    }
  }

  private extractImports(content: string): string[] {
    const imports: string[] = [];
    const importRegex = /import\s+(?:(?:(?:"([^"]+)"|'([^']+)')|(?:{[^}]+}\s+from\s+(?:"([^"]+)"|'([^']+)'))))/g;
    let match;
    
    while ((match = importRegex.exec(content)) !== null) {
      const importPath = match[1] || match[2] || match[3] || match[4];
      if (importPath && (importPath.startsWith('@openzeppelin/') || importPath.startsWith('..'))) {
        // Handle relative imports within OpenZeppelin packages
        if (importPath.startsWith('..') && content.includes('@openzeppelin/')) {
          // Convert relative imports to absolute OpenZeppelin imports
          const absolutePath = this.resolveRelativeImport(importPath);
          if (absolutePath) {
            imports.push(absolutePath);
          }
        } else {
          imports.push(importPath);
        }
      }
    }
    
    return imports;
  }

  private resolveRelativeImport(relativePath: string): string | null {
    // Common OpenZeppelin relative import patterns
    const pathMappings: Record<string, string> = {
      '../utils/ContextUpgradeable.sol': '@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol',
      '../../utils/ContextUpgradeable.sol': '@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol',
      '../../../utils/ContextUpgradeable.sol': '@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol',
      '../utils/introspection/ERC165Upgradeable.sol': '@openzeppelin/contracts-upgradeable/utils/introspection/ERC165Upgradeable.sol',
      '../utils/PausableUpgradeable.sol': '@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol',
      '../../../utils/PausableUpgradeable.sol': '@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol',
      '../utils/cryptography/EIP712Upgradeable.sol': '@openzeppelin/contracts-upgradeable/utils/cryptography/EIP712Upgradeable.sol',
      '../../../utils/cryptography/EIP712Upgradeable.sol': '@openzeppelin/contracts-upgradeable/utils/cryptography/EIP712Upgradeable.sol',
      '../utils/NoncesUpgradeable.sol': '@openzeppelin/contracts-upgradeable/utils/NoncesUpgradeable.sol',
      '../../../utils/NoncesUpgradeable.sol': '@openzeppelin/contracts-upgradeable/utils/NoncesUpgradeable.sol',
      '../beacon/IBeacon.sol': '@openzeppelin/contracts/proxy/beacon/IBeacon.sol',
      '../../utils/Address.sol': '@openzeppelin/contracts/utils/Address.sol',
      '../../utils/StorageSlot.sol': '@openzeppelin/contracts/utils/StorageSlot.sol',
      '../utils/Initializable.sol': '@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol',
      '../../proxy/utils/Initializable.sol': '@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol',
    };

    return pathMappings[relativePath] || null;
  }

  destroy(): void {
    if (this.worker) {
      // Clear all pending requests
      this.pending.forEach(({ reject }) => {
        reject(new Error('Compiler destroyed'));
      });
      this.pending.clear();
      
      // Terminate worker
      this.worker.terminate();
      this.worker = null;
      
      // Clear caches
      this.importCache.clear();
      this.availableVersions = [];
    }
  }
}