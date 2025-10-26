import type { Address } from 'viem';

import config from 'configs/app';

interface TransactionNotification {
  hash: string;
  from: Address;
  to?: Address;
  value?: bigint;
  status?: 'pending' | 'confirmed' | 'failed';
}

export class BlockscoutIntegration {
  private static instance: BlockscoutIntegration;
  private baseUrl: string;

  private constructor() {
    // Use the current Blockscout instance API
    this.baseUrl = config.app.baseUrl;
  }

  static getInstance(): BlockscoutIntegration {
    if (!BlockscoutIntegration.instance) {
      BlockscoutIntegration.instance = new BlockscoutIntegration();
    }
    return BlockscoutIntegration.instance;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  showTransactionToast(_notification: TransactionNotification): void { /* to be implemented in React components */ }

  async waitForTransaction(hash: string): Promise<unknown> {
    const maxAttempts = 60; // 5 minutes with 5-second intervals
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const response = await fetch(`${ this.baseUrl }/api/v2/transactions/${ hash }`);
        if (response.ok) {
          const data = await response.json() as { status?: string; [key: string]: unknown };
          if (data.status === 'ok' || data.status === '0x1') {
            return data;
          } else if (data.status === 'error' || data.status === '0x0') {
            return data;
          }
        }
      } catch (error) { /* Error checking transaction status */ }

      attempts++;
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
    }

    return null;
  }

  async verifyContract(
    address: string,
    sourceCode: string,
    contractName: string,
    compilerVersion: string,
    optimizationEnabled: boolean,
    runs: number,
    constructorArguments?: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const formData = new FormData();
      formData.append('addressHash', address);
      formData.append('sourceCode', sourceCode);
      formData.append('contractName', contractName);
      formData.append('compilerVersion', compilerVersion);
      formData.append('optimization', optimizationEnabled ? 'true' : 'false');
      formData.append('optimizationRuns', runs.toString());
      if (constructorArguments) {
        formData.append('constructorArguments', constructorArguments);
      }

      const response = await fetch(`${ this.baseUrl }/api/v2/smart-contracts/verification/via/standard`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json() as { message?: string };

      if (response.ok && data.message === 'OK') {
        return { success: true, message: 'Contract verified successfully' };
      } else {
        return { success: false, message: data.message || 'Verification failed' };
      }
    } catch (error) {
      // Contract verification error
      return { success: false, message: (error as Error).message || 'Verification failed' };
    }
  }

  getExplorerUrl(type: 'tx' | 'address', hash: string): string {
    return `${ config.app.baseUrl }/${ type }/${ hash }`;
  }
}

// Export a hook for React components
export const useBlockscoutIntegration = () => {
  return BlockscoutIntegration.getInstance();
};
