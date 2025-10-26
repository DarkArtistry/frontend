import type { ArrayElement } from 'types/utils';

export const VALIDATORS_CHAIN_TYPE = [
  'stability',
  'blackfort',
  'zilliqa',
  'beacon',
] as const;

export type ValidatorsChainType = ArrayElement<typeof VALIDATORS_CHAIN_TYPE>;
