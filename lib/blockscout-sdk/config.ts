import { createBlockscoutConfig } from './mock-sdk';

// Blockscout SDK configuration for ROAX network
export const blockscoutConfig = createBlockscoutConfig([
  {
    id: 135, // ROAX chain ID
    name: 'ROAX Tricca TestNet',
    explorerUrl: 'https://ethglobal-blockscout.roax.network',
  },
  // Add more chains here as needed
]);

export const defaultChainId = 135;