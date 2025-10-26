import type { Feature } from './types';

import { getEnvValue } from '../utils';

const title = 'Build & Deploy Contract';

const config: Feature<{ }> = (() => {
  const isEnabled = getEnvValue('NEXT_PUBLIC_CONTRACT_EDITOR_ENABLED') === 'true';

  if (isEnabled) {
    return Object.freeze({
      title,
      isEnabled: true,
    });
  }

  return Object.freeze({
    title,
    isEnabled: false,
  });
})();

export default config;