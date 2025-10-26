import React from 'react';
import { blockscoutConfig } from './config';

// ETHGlobal: Dynamic import with fallback
let NotificationProvider: any;
let TransactionPopupProvider: any;

try {
  // Try to use the real Blockscout SDK
  const sdk = require('@blockscout/app-sdk');
  NotificationProvider = sdk.NotificationProvider;
  TransactionPopupProvider = sdk.TransactionPopupProvider;
  console.log('[MEGA Blockscout] Using real Blockscout SDK ✓');
} catch (e) {
  // Fallback to mock if real SDK not installed
  console.warn('[MEGA Blockscout] Real SDK not found, using mock implementation');
  console.warn('[MEGA Blockscout] Install with: npm install @blockscout/app-sdk --legacy-peer-deps');
  const mockSdk = require('./mock-sdk');
  NotificationProvider = mockSdk.NotificationProvider;
  TransactionPopupProvider = mockSdk.TransactionPopupProvider;
}

interface BlockscoutSDKProviderProps {
  children: React.ReactNode;
}

export const BlockscoutSDKProvider: React.FC<BlockscoutSDKProviderProps> = ({ children }) => {
  return (
    <NotificationProvider config={blockscoutConfig}>
      <TransactionPopupProvider>
        {children}
      </TransactionPopupProvider>
    </NotificationProvider>
  );
};