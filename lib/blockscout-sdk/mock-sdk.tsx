// Temporary mock implementation of Blockscout SDK
// This follows the official SDK API structure for development
// Replace with real @blockscout/app-sdk when package installation is resolved

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { toaster } from 'toolkit/chakra/toaster';

// Types matching the official SDK
interface NotificationConfig {
  chainId: number;
  pending?: {
    title: string;
    description: string;
  };
  success?: {
    title: string;
    description: string;
  };
  error?: {
    title: string;
    description: string;
  };
}

interface TransactionPopupConfig {
  chainId: number;
}

interface NotificationContextType {
  showNotification: (hash: string | null, config: NotificationConfig) => void;
}

interface TransactionPopupContextType {
  openPopup: (config: TransactionPopupConfig) => void;
}

// Context implementations
const NotificationContext = createContext<NotificationContextType | null>(null);
const TransactionPopupContext = createContext<TransactionPopupContextType | null>(null);

// Mock notification provider
export const NotificationProvider: React.FC<{ 
  config: { chains: Array<{ id: number; name: string; explorerUrl: string }> };
  children: ReactNode;
}> = ({ children, config }) => {
  const showNotification = useCallback((hash: string | null, notificationConfig: NotificationConfig) => {
    const chain = config.chains.find(c => c.id === notificationConfig.chainId);
    const explorerUrl = chain?.explorerUrl || 'https://ethglobal-blockscout.roax.network';
    
    if (hash) {
      // Show pending notification immediately
      if (notificationConfig.pending) {
        toaster.create({
          title: `🔗 SDK: ${notificationConfig.pending.title}`,
          description: notificationConfig.pending.description,
          type: 'info',
          duration: 5000,
        });
      }
      
      // Mock transaction monitoring (in real SDK this would be automatic)
      setTimeout(() => {
        // Simulate transaction success (90% success rate)
        const isSuccess = Math.random() > 0.1;
        
        if (isSuccess && notificationConfig.success) {
          toaster.create({
            title: `✅ SDK: ${notificationConfig.success.title}`,
            description: notificationConfig.success.description,
            type: 'success',
            meta: {
              renderDescription: () => (
                <div>
                  <p>{notificationConfig.success!.description}</p>
                  <a 
                    href={`${explorerUrl}/tx/${hash}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ color: '#3182CE', textDecoration: 'underline' }}
                  >
                    🔍 View on Explorer
                  </a>
                </div>
              ),
            },
          });
        } else if (!isSuccess && notificationConfig.error) {
          toaster.create({
            title: `❌ SDK: ${notificationConfig.error.title}`,
            description: notificationConfig.error.description,
            type: 'error',
            meta: {
              renderDescription: () => (
                <div>
                  <p>{notificationConfig.error!.description}</p>
                  {hash && (
                    <a 
                      href={`${explorerUrl}/tx/${hash}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ color: '#E53E3E', textDecoration: 'underline' }}
                    >
                      🔍 View Failed Transaction
                    </a>
                  )}
                </div>
              ),
            },
          });
        }
      }, 3000); // Simulate 3 second transaction time
    } else {
      // Handle error notifications without hash
      if (notificationConfig.error) {
        toaster.create({
          title: `❌ SDK: ${notificationConfig.error.title}`,
          description: notificationConfig.error.description,
          type: 'error',
        });
      }
    }
  }, [config]);

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
    </NotificationContext.Provider>
  );
};

// Mock transaction popup provider
export const TransactionPopupProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const openPopup = useCallback((config: TransactionPopupConfig) => {
    const explorerUrl = 'https://ethglobal-blockscout.roax.network';
    
    // Mock implementation - in real SDK this would open a transaction history popup
    toaster.create({
      title: '📋 SDK: Transaction History',
      description: `ROAX Tricca TestNet (Chain ID: ${config.chainId})`,
      type: 'info',
      meta: {
        renderDescription: () => (
          <div style={{ maxWidth: '400px' }}>
            <p><strong>🔗 Recent Transactions</strong></p>
            
            {/* Mock transaction list */}
            <div style={{ marginTop: '12px', fontSize: '14px' }}>
              <div style={{ padding: '8px', background: '#f5f5f5', borderRadius: '4px', marginBottom: '8px' }}>
                <strong>Contract Deployment</strong>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  Status: <span style={{ color: '#48BB78' }}>✅ Success</span> • Block: 1234567
                </div>
                <a 
                  href={`${explorerUrl}/tx/0x123...abc`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: '12px', color: '#3182CE', textDecoration: 'underline' }}
                >
                  View Transaction
                </a>
              </div>
              
              <div style={{ padding: '8px', background: '#f5f5f5', borderRadius: '4px', marginBottom: '8px' }}>
                <strong>Token Transfer</strong>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  Status: <span style={{ color: '#48BB78' }}>✅ Success</span> • Block: 1234566
                </div>
                <a 
                  href={`${explorerUrl}/tx/0x456...def`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: '12px', color: '#3182CE', textDecoration: 'underline' }}
                >
                  View Transaction
                </a>
              </div>
            </div>
            
            <div style={{ marginTop: '12px', padding: '12px', background: '#e6f3ff', borderRadius: '4px' }}>
              <p style={{ margin: 0, fontWeight: 'bold', marginBottom: '8px' }}>
                📊 View Your Real Transactions:
              </p>
              <a 
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#2B6CB0', textDecoration: 'underline', display: 'block' }}
              >
                🔍 Open Blockscout Explorer
              </a>
              <p style={{ fontSize: '12px', color: '#666', marginTop: '4px', margin: 0 }}>
                Search for your wallet address to see all real transactions
              </p>
            </div>
            
            <p style={{ fontSize: '11px', color: '#888', marginTop: '12px', fontStyle: 'italic' }}>
              Note: This is a mock. Real SDK would fetch actual transaction history.
            </p>
          </div>
        ),
      },
      duration: 20000,
    });
  }, []);

  return (
    <TransactionPopupContext.Provider value={{ openPopup }}>
      {children}
    </TransactionPopupContext.Provider>
  );
};

// Hooks matching the official SDK API
export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};

export const useTransactionPopup = (): TransactionPopupContextType => {
  const context = useContext(TransactionPopupContext);
  if (!context) {
    throw new Error('useTransactionPopup must be used within TransactionPopupProvider');
  }
  return context;
};

// Configuration helper
export const createBlockscoutConfig = (chains: Array<{ id: number; name: string; explorerUrl: string }>) => ({
  chains,
});