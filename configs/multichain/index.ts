import type { MultichainConfig } from 'types/multichain';

import config from 'configs/app';
import { isBrowser } from 'toolkit/utils/isBrowser';

const multichainConfig: () => MultichainConfig | undefined = () => {
  if (!config.features.opSuperchain.isEnabled) {
    return;
  }

  if (isBrowser()) {
    return window.__multichainConfig;
  }

  // Dynamic import only in Node.js environment
  const multichainConfigNodejs = require('configs/multichain/config.nodejs');
  return multichainConfigNodejs.getValue();
};

export default multichainConfig;
