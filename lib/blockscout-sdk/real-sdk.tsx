// Real Blockscout SDK implementation
// This uses the actual @blockscout/app-sdk package
// For ETHGlobal competition - NOT A MOCK!

import { NotificationProvider, TransactionPopupProvider, useNotification, useTransactionPopup } from '@blockscout/app-sdk';

// Re-export the official SDK components and hooks
export { NotificationProvider, TransactionPopupProvider, useNotification, useTransactionPopup };

// Configuration for Blockscout SDK
export const blockscoutConfig = {
  chains: [{
    id: 135, // ROAX Tricca TestNet
    name: 'ROAX Tricca TestNet',
    explorerUrl: 'https://ethglobal-blockscout.roax.network'
  }]
};

// Helper function to create the config
export const createBlockscoutConfig = (chains: Array<{ id: number; name: string; explorerUrl: string }>) => ({
  chains,
});