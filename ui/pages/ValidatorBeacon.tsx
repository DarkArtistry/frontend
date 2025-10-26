import { Badge, Box, Flex, Grid, Text } from '@chakra-ui/react';
import { useRouter } from 'next/router';
import React from 'react';

import config from 'configs/app';
import useApiQuery from 'lib/api/useApiQuery';
import getQueryParamString from 'lib/router/getQueryParamString';
import { Skeleton } from 'toolkit/chakra/skeleton';
import DataFetchAlert from 'ui/shared/DataFetchAlert';
import * as DetailedInfo from 'ui/shared/DetailedInfo/DetailedInfo';
import PageTitle from 'ui/shared/Page/PageTitle';

const ValidatorBeacon = () => {
  const router = useRouter();
  const validatorIndexString = getQueryParamString(router.query.id);

  const validatorQuery = useApiQuery('validators:item', {
    pathParams: {
      index: validatorIndexString,
    },
    queryOptions: {
      enabled: Boolean(validatorIndexString),
      refetchInterval: 30 * 1000, // 30 seconds
    },
  });

  if (!validatorQuery.data && !validatorQuery.isPlaceholderData) {
    return <DataFetchAlert/>;
  }

  const validator = validatorQuery.data;
  if (!validator) {
    return null;
  }

  const getStatusColor = () => {
    if (validator.slashed) return 'red';
    if (validator.status === 'active_ongoing') return 'green';
    if (validator.status === 'pending') return 'yellow';
    if (validator.status === 'withdrawal_done') return 'blue';
    if (validator.status === 'exited') return 'gray';
    return 'gray';
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const content = (
    <DetailedInfo.Container mt={ 8 }>
      <DetailedInfo.ItemLabel>Validator Index</DetailedInfo.ItemLabel>
      <DetailedInfo.ItemValue>
        <Skeleton loading={ validatorQuery.isPlaceholderData }>
          <Text fontSize="lg" fontWeight="semibold">
            { validator.index }
          </Text>
        </Skeleton>
      </DetailedInfo.ItemValue>

      <DetailedInfo.ItemLabel>Status</DetailedInfo.ItemLabel>
      <DetailedInfo.ItemValue>
        <Skeleton loading={ validatorQuery.isPlaceholderData }>
          <Badge
            colorScheme={ getStatusColor() }
            variant="subtle"
            fontSize="sm"
            px={ 3 }
            py={ 1 }
          >
            { formatStatus(validator.status) }
          </Badge>
          { validator.slashed && (
            <Badge colorScheme="red" ml={ 2 } fontSize="xs">
              SLASHED
            </Badge>
          ) }
        </Skeleton>
      </DetailedInfo.ItemValue>

      <DetailedInfo.ItemLabel>Public Key</DetailedInfo.ItemLabel>
      <DetailedInfo.ItemValue wordBreak="break-all">
        <Skeleton loading={ validatorQuery.isPlaceholderData }>
          <Text fontFamily="mono" fontSize="sm">
            { validator.pubkey }
          </Text>
        </Skeleton>
      </DetailedInfo.ItemValue>

      <DetailedInfo.ItemLabel>Effective Balance</DetailedInfo.ItemLabel>
      <DetailedInfo.ItemValue>
        <Skeleton loading={ validatorQuery.isPlaceholderData }>
          <Text fontSize="lg" fontWeight="semibold">
            { (Number(validator.effective_balance) / 1e9).toFixed(4) } ETH
          </Text>
        </Skeleton>
      </DetailedInfo.ItemValue>

      <DetailedInfo.ItemLabel>Withdrawal Credentials</DetailedInfo.ItemLabel>
      <DetailedInfo.ItemValue wordBreak="break-all">
        <Skeleton loading={ validatorQuery.isPlaceholderData }>
          <Text fontFamily="mono" fontSize="sm">
            { validator.withdrawal_credentials || 'N/A' }
          </Text>
        </Skeleton>
      </DetailedInfo.ItemValue>

      <DetailedInfo.ItemLabel>Activation Epoch</DetailedInfo.ItemLabel>
      <DetailedInfo.ItemValue>
        <Skeleton loading={ validatorQuery.isPlaceholderData }>
          { validator.activation_epoch || 'N/A' }
        </Skeleton>
      </DetailedInfo.ItemValue>

      { validator.activation_eligibility_epoch !== null && validator.activation_eligibility_epoch !== undefined && (
        <>
          <DetailedInfo.ItemLabel>Activation Eligibility Epoch</DetailedInfo.ItemLabel>
          <DetailedInfo.ItemValue>
            <Skeleton loading={ validatorQuery.isPlaceholderData }>
              { validator.activation_eligibility_epoch }
            </Skeleton>
          </DetailedInfo.ItemValue>
        </>
      ) }

      { validator.exit_epoch !== null && validator.exit_epoch !== undefined && (
        <>
          <DetailedInfo.ItemLabel>Exit Epoch</DetailedInfo.ItemLabel>
          <DetailedInfo.ItemValue>
            <Skeleton loading={ validatorQuery.isPlaceholderData }>
              { validator.exit_epoch }
            </Skeleton>
          </DetailedInfo.ItemValue>
        </>
      ) }

      { validator.withdrawable_epoch !== null && validator.withdrawable_epoch !== undefined && (
        <>
          <DetailedInfo.ItemLabel>Withdrawable Epoch</DetailedInfo.ItemLabel>
          <DetailedInfo.ItemValue>
            <Skeleton loading={ validatorQuery.isPlaceholderData }>
              { validator.withdrawable_epoch }
            </Skeleton>
          </DetailedInfo.ItemValue>
        </>
      ) }

      { validator.last_attestation_slot !== null && validator.last_attestation_slot !== undefined && (
        <>
          <DetailedInfo.ItemLabel>Last Attestation Slot</DetailedInfo.ItemLabel>
          <DetailedInfo.ItemValue>
            <Skeleton loading={ validatorQuery.isPlaceholderData }>
              { validator.last_attestation_slot }
            </Skeleton>
          </DetailedInfo.ItemValue>
        </>
      ) }
    </DetailedInfo.Container>
  );

  return (
    <>
      <PageTitle
        title={ `Validator #${ validator?.index || validatorIndexString }` }
      />
      { content }
    </>
  );
};

export default ValidatorBeacon;