// Solidity compiler Web Worker - Direct WASM interface
let solc = null;
let loadedVersion = null;

// Map of supported compiler versions
const versions = {
  '0.8.26': '/solc/soljson-v0.8.26.js',
  '0.8.25': '/solc/soljson-v0.8.25.js',
  '0.8.24': '/solc/soljson-v0.8.24.js',
  '0.8.20': '/solc/soljson-v0.8.20.js',
  '0.8.19': '/solc/soljson-v0.8.19.js'
};

// Handle incoming compilation requests
self.onmessage = async function(e) {
  const { id, action, data } = e.data;

  try {
    switch (action) {
      case 'loadCompiler':
        const version = data.version || '0.8.26';
        await loadCompiler(version);
        self.postMessage({ id, success: true });
        break;

      case 'compile':
        if (!solc) {
          await loadCompiler('0.8.26'); // Default version
        }
        const result = compile(data.input);
        self.postMessage({ id, success: true, result });
        break;

      case 'getVersions':
        self.postMessage({ 
          id, 
          success: true, 
          result: Object.keys(versions) 
        });
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    self.postMessage({ 
      id, 
      success: false, 
      error: error.message || 'Unknown error' 
    });
  }
};

// Load compiler directly without external wrapper
async function loadCompiler(version) {
  // If same version is already loaded, skip
  if (solc && loadedVersion === version) return;

  const wasmUrl = versions[version];
  if (!wasmUrl) {
    throw new Error(`Version ${version} not supported. Available versions: ${Object.keys(versions).join(', ')}`);
  }

  try {
    // Clear any previously loaded compiler
    solc = null;
    loadedVersion = null;
    self.Module = undefined;
    
    // Load the soljson WASM module directly
    self.importScripts(wasmUrl);

    // Wait for Module to be ready
    await new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 200; // 10 seconds with 50ms intervals
      
      const checkInterval = setInterval(() => {
        attempts++;
        
        // Check if Module is ready and has the required functions
        if (typeof Module !== 'undefined' && Module.cwrap) {
          clearInterval(checkInterval);
          
          try {
            // Create our own solc wrapper
            solc = createSolcWrapper(Module);
            resolve();
          } catch (wrapperError) {
            reject(new Error('Failed to create compiler wrapper: ' + wrapperError.message));
          }
        } else if (attempts >= maxAttempts) {
          clearInterval(checkInterval);
          reject(new Error('Compiler loading timeout'));
        }
      }, 50);
    });

    loadedVersion = version;
    console.log(`Solidity compiler ${version} loaded successfully`);
  } catch (error) {
    console.error('Failed to load compiler:', error);
    throw new Error(`Failed to load compiler ${version}: ${error.message}`);
  }
}

// Create a solc wrapper that works in web workers
function createSolcWrapper(Module) {
  // Create the wrapper functions
  const wrapper = {
    compile: function(input) {
      // Input validation
      if (!input || typeof input !== 'string') {
        throw new Error('Input must be a non-empty string');
      }
      
      try {
        // Method 1: Try solidity_compile (standard JSON interface)
        if (Module.cwrap) {
          try {
            const compile = Module.cwrap('solidity_compile', 'string', ['string', 'number']);
            const result = compile(input, 0); // 0 = no optimization callback
            if (result) {
              return result;
            }
          } catch (e) {
            console.log('Method 1 failed, trying method 2:', e.message);
          }

          // Method 2: Try compileJSON
          try {
            const compileJSON = Module.cwrap('compileJSON', 'string', ['string', 'number']);
            const result = compileJSON(input, 1); // 1 = enable optimization
            if (result) {
              return result;
            }
          } catch (e) {
            console.log('Method 2 failed, trying method 3:', e.message);
          }

          // Method 3: Try compileJSONMulti
          try {
            const compileJSONMulti = Module.cwrap('compileJSONMulti', 'string', ['string', 'number']);
            const result = compileJSONMulti(input, 1);
            if (result) {
              return result;
            }
          } catch (e) {
            console.log('Method 3 failed:', e.message);
          }
        }

        // Method 4: Try direct Module access (fallback)
        if (typeof Module.compile === 'function') {
          return Module.compile(input);
        }

        throw new Error('No compatible compile function found in the WASM module');
      } catch (error) {
        console.error('Compilation error details:', error);
        throw new Error(`Compilation failed: ${error.message}`);
      }
    },

    version: function() {
      try {
        if (Module.cwrap) {
          const version = Module.cwrap('solidity_version', 'string', []);
          return version();
        }
        return loadedVersion || 'unknown';
      } catch (e) {
        return loadedVersion || 'unknown';
      }
    }
  };

  return wrapper;
}

// Compile function
function compile(input) {
  if (!solc) {
    throw new Error('Compiler not loaded. Call loadCompiler first.');
  }

  try {
    // The input should be a JSON string
    const inputString = typeof input === 'string' ? input : JSON.stringify(input);
    
    // Use our wrapper's compile function
    const output = solc.compile(inputString);
    
    // Validate output
    if (!output) {
      throw new Error('Compilation returned empty output');
    }

    return output;
  } catch (error) {
    console.error('Compilation error:', error);
    throw new Error(`Compilation failed: ${error.message}`);
  }
}