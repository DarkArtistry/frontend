import type { ApiResource } from '../types';

export interface Validator {
  index: number;
  pubkey: string;
  effective_balance: string;
  slashed: boolean;
  status: string;
  activation_epoch?: number | null;
  activation_eligibility_epoch?: number | null;
  exit_epoch?: number | null;
  withdrawable_epoch?: number | null;
  withdrawal_credentials?: string;
  last_attestation_slot?: number | null;
}

export interface ValidatorBalance {
  epoch: number;
  balance: string;
  effective_balance: string;
}

export interface Withdrawal {
  index: number;
  validator_index: number;
  address: string;
  amount: string;
  block_number: number;
}

export interface Slashing {
  validator_index: number;
  epoch: number;
  slasher_index?: number;
}

export interface ValidatorCounters {
  total: number;
  active_ongoing: number;
  pending: number;
  exited: number;
  slashed: number;
}

export interface ValidatorDetail extends Validator {
  balances?: Array<ValidatorBalance>;
  withdrawals?: Array<Withdrawal>;
  slashings?: Array<Slashing>;
}

export interface ValidatorsResponse {
  items: Array<Validator>;
  next_page_params: {
    index: number;
  } | null;
}

export const VALIDATORS_API_RESOURCES = {
  list: {
    path: '/api/v2/validators/beacon',
    paginated: true,
  },
  counters: {
    path: '/api/v2/validators/beacon/counters',
  },
  item: {
    path: '/api/v2/validators/beacon/:index',
    pathParams: [ 'index' as const ],
  },
  slashed: {
    path: '/api/v2/validators/beacon/slashed',
    paginated: true,
  },
} satisfies Record<string, ApiResource>;

export type ValidatorsApiResourceName = `validators:${ keyof typeof VALIDATORS_API_RESOURCES }`;

/* eslint-disable @stylistic/indent */
export type ValidatorsApiResourcePayload<R extends ValidatorsApiResourceName> =
R extends 'validators:list' ? ValidatorsResponse :
R extends 'validators:counters' ? ValidatorCounters :
R extends 'validators:item' ? ValidatorDetail :
R extends 'validators:slashed' ? ValidatorsResponse :
never;
/* eslint-enable @stylistic/indent */
