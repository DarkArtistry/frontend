import type { Chain } from 'viem';

import appConfig from 'configs/app';
import essentialDappsChainsConfig from 'configs/essential-dapps-chains';
import multichainConfig from 'configs/multichain';

const getChainInfo = (config: typeof appConfig = appConfig, contracts?: Chain['contracts']): Chain => {
  // Force ROAX configuration to override any incorrect environment values
  return {
    id: 135, // ROAX chain ID - forced
    name: 'ROAX Tricca TestNet',
    nativeCurrency: {
      decimals: 18,
      name: 'PLASMA',
      symbol: 'PLASMA',
    },
    rpcUrls: {
      'default': {
        http: ['https://devrpc.roax.network'],
      },
    },
    blockExplorers: {
      'default': {
        name: 'Blockscout',
        url: config.app.baseUrl || 'http://localhost:3000',
      },
    },
    testnet: true,
    contracts,
  };
};

export const currentChain: Chain | undefined = !appConfig.features.opSuperchain.isEnabled ? getChainInfo() : undefined;

export const parentChain: Chain | undefined = (() => {
  const rollupFeature = appConfig.features.rollup;

  const parentChain = rollupFeature.isEnabled && rollupFeature.parentChain;

  if (!parentChain) {
    return;
  }

  if (!parentChain.id || !parentChain.name || !parentChain.rpcUrls || !parentChain.baseUrl || !parentChain.currency) {
    return;
  }

  return {
    id: parentChain.id,
    name: parentChain.name,
    nativeCurrency: parentChain.currency,
    rpcUrls: {
      'default': {
        http: parentChain.rpcUrls,
      },
    },
    blockExplorers: {
      'default': {
        name: 'Blockscout',
        url: parentChain.baseUrl,
      },
    },
    testnet: parentChain.isTestnet,
  };
})();

export const clusterChains: Array<Chain> | undefined = (() => {
  const config = multichainConfig();

  if (!config) {
    return;
  }

  return config.chains.map(({ config, contracts }) => getChainInfo(config, contracts)).filter(Boolean);
})();

export const essentialDappsChains: Array<Chain> | undefined = (() => {
  const config = essentialDappsChainsConfig();

  if (!config) {
    return;
  }

  return config.chains.map(({ config, contracts }) => getChainInfo(config, contracts)).filter(Boolean);
})();

export const chains = (() => {
  if (essentialDappsChains) {
    const hasCurrentChain = essentialDappsChains.some((chain) => chain.id === currentChain?.id);
    const hasParentChain = essentialDappsChains.some((chain) => chain.id === parentChain?.id);

    return [
      ...essentialDappsChains,
      hasCurrentChain ? undefined : currentChain,
      hasParentChain ? undefined : parentChain,
    ].filter(Boolean);
  }

  return [ currentChain, parentChain, ...(clusterChains ?? []) ].filter(Boolean);
})();
