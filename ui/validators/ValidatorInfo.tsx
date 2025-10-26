import React from 'react';

import type { ValidatorDetail } from 'lib/api/services/validators';

import { Skeleton } from 'toolkit/chakra/skeleton';
import * as DetailedInfo from 'ui/shared/DetailedInfo/DetailedInfo';

interface Props {
  data?: ValidatorDetail;
}

const ValidatorInfo = ({ data }: Props) => {
  if (!data) {
    return null;
  }

  return (
    <DetailedInfo.Container>
      <DetailedInfo.ItemLabel hint="Unique identifier for this validator">
        Validator index
      </DetailedInfo.ItemLabel>
      <DetailedInfo.ItemValue>
        { data.index }
      </DetailedInfo.ItemValue>

      <DetailedInfo.ItemLabel hint="BLS public key of the validator">
        Public key
      </DetailedInfo.ItemLabel>
      <DetailedInfo.ItemValue>
        { data.pubkey }
      </DetailedInfo.ItemValue>

      <DetailedInfo.ItemLabel hint="Current status of the validator">
        Status
      </DetailedInfo.ItemLabel>
      <DetailedInfo.ItemValue>
        { data.status }
      </DetailedInfo.ItemValue>

      <DetailedInfo.ItemLabel hint="Balance used for reward calculations">
        Effective balance
      </DetailedInfo.ItemLabel>
      <DetailedInfo.ItemValue>
        { (Number(data.effective_balance) / 1e18).toFixed(4) } ETH
      </DetailedInfo.ItemValue>

      <DetailedInfo.ItemLabel hint="Whether the validator has been slashed">
        Slashed
      </DetailedInfo.ItemLabel>
      <DetailedInfo.ItemValue>
        { data.slashed ? 'Yes' : 'No' }
      </DetailedInfo.ItemValue>

      { data.activation_epoch && (
        <>
          <DetailedInfo.ItemLabel hint="Epoch when the validator became active">
            Activation epoch
          </DetailedInfo.ItemLabel>
          <DetailedInfo.ItemValue>
            { data.activation_epoch }
          </DetailedInfo.ItemValue>
        </>
      ) }

      { data.exit_epoch && (
        <>
          <DetailedInfo.ItemLabel hint="Epoch when the validator exited">
            Exit epoch
          </DetailedInfo.ItemLabel>
          <DetailedInfo.ItemValue>
            { data.exit_epoch }
          </DetailedInfo.ItemValue>
        </>
      ) }

      { data.withdrawal_credentials && (
        <>
          <DetailedInfo.ItemLabel hint="Credentials for withdrawing funds">
            Withdrawal credentials
          </DetailedInfo.ItemLabel>
          <DetailedInfo.ItemValue>
            { data.withdrawal_credentials }
          </DetailedInfo.ItemValue>
        </>
      ) }
    </DetailedInfo.Container>
  );
};

export default ValidatorInfo;
