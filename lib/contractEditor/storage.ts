import { v4 as uuidv4 } from 'uuid';

export interface ContractFile {
  id: string;
  name: string;
  content: string;
  lastModified: number;
}

export interface ContractProject {
  id: string;
  name: string;
  files: Array<ContractFile>;
  activeFileId?: string;
  createdAt: number;
  lastModified: number;
}

const STORAGE_KEY = 'blockscout_contract_editor_projects';

export class ContractStorage {
  private static instance: ContractStorage;
  private walletAddress: string | null = null;

  private constructor() {}

  static getInstance(): ContractStorage {
    if (!ContractStorage.instance) {
      ContractStorage.instance = new ContractStorage();
    }
    return ContractStorage.instance;
  }

  setWalletAddress(address: string | null): void {
    this.walletAddress = address?.toLowerCase() || null;
    if (!address) {
      // Clear storage when wallet disconnects
      this.clearUserData();
    }
  }

  private getStorageKey(): string {
    return this.walletAddress ? `${ STORAGE_KEY }_${ this.walletAddress }` : STORAGE_KEY;
  }

  clearUserData(): void {
    if (typeof window === 'undefined' || !this.walletAddress) {
      return;
    }
    localStorage.removeItem(this.getStorageKey());
  }

  private getStorageData(): Record<string, ContractProject> {
    if (typeof window === 'undefined') {
      return {};
    }

    try {
      const data = localStorage.getItem(this.getStorageKey());
      return data ? JSON.parse(data) as Record<string, ContractProject> : {};
    } catch (error) {
      // Error reading from localStorage
      return {};
    }
  }

  private saveStorageData(data: Record<string, ContractProject>): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      localStorage.setItem(this.getStorageKey(), JSON.stringify(data));
    } catch (error) {}
  }

  createProject(name: string): ContractProject {
    const project: ContractProject = {
      id: uuidv4(),
      name,
      files: [
        {
          id: uuidv4(),
          name: 'contract.sol',
          content: '// SPDX-License-Identifier: MIT\npragma solidity ^0.8.0;\n\ncontract MyContract {\n    // Your code here\n}\n',
          lastModified: Date.now(),
        },
      ],
      createdAt: Date.now(),
      lastModified: Date.now(),
    };

    const data = this.getStorageData();
    data[project.id] = project;
    this.saveStorageData(data);

    return project;
  }

  getProject(projectId: string): ContractProject | null {
    const data = this.getStorageData();
    return data[projectId] || null;
  }

  getAllProjects(): Array<ContractProject> {
    const data = this.getStorageData();
    return Object.values(data).sort((a, b) => b.lastModified - a.lastModified);
  }

  updateProject(projectId: string, updates: Partial<ContractProject>): void {
    const data = this.getStorageData();
    if (data[projectId]) {
      data[projectId] = {
        ...data[projectId],
        ...updates,
        lastModified: Date.now(),
      };
      this.saveStorageData(data);
    }
  }

  deleteProject(projectId: string): void {
    const data = this.getStorageData();
    delete data[projectId];
    this.saveStorageData(data);
  }

  addFile(projectId: string, fileName: string, content: string = ''): ContractFile | null {
    const data = this.getStorageData();
    const project = data[projectId];
    if (!project) {
      return null;
    }

    const newFile: ContractFile = {
      id: uuidv4(),
      name: fileName,
      content,
      lastModified: Date.now(),
    };

    project.files.push(newFile);
    project.lastModified = Date.now();
    this.saveStorageData(data);

    return newFile;
  }

  updateFile(projectId: string, fileId: string, updates: Partial<ContractFile>): void {
    const data = this.getStorageData();
    const project = data[projectId];
    if (!project) {
      return;
    }

    const fileIndex = project.files.findIndex(f => f.id === fileId);
    if (fileIndex >= 0) {
      project.files[fileIndex] = {
        ...project.files[fileIndex],
        ...updates,
        lastModified: Date.now(),
      };
      project.lastModified = Date.now();
      this.saveStorageData(data);
    }
  }

  deleteFile(projectId: string, fileId: string): void {
    const data = this.getStorageData();
    const project = data[projectId];
    if (!project) {
      return;
    }

    project.files = project.files.filter(f => f.id !== fileId);
    project.lastModified = Date.now();
    this.saveStorageData(data);
  }

  // Auto-save functionality
  private autoSaveTimer: ReturnType<typeof setTimeout> | null = null;

  autoSaveFile(projectId: string, fileId: string, content: string, delay: number = 1000): void {
    if (this.autoSaveTimer) {
      clearTimeout(this.autoSaveTimer);
    }

    this.autoSaveTimer = setTimeout(() => {
      this.updateFile(projectId, fileId, { content });
    }, delay);
  }

  // Import/Export functionality
  exportProject(projectId: string): string | null {
    const project = this.getProject(projectId);
    if (!project) {
      return null;
    }

    return JSON.stringify(project, null, 2);
  }

  importProject(projectData: string): ContractProject | null {
    try {
      const project = JSON.parse(projectData) as ContractProject;
      project.id = uuidv4(); // Generate new ID to avoid conflicts
      project.lastModified = Date.now();
      const data = this.getStorageData();
      data[project.id] = project;
      this.saveStorageData(data);

      return project;
    } catch (error) {
      // Error importing project
      return null;
    }
  }
}
