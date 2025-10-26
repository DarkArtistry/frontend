import { Box, Grid, Heading, Skeleton } from '@chakra-ui/react';
import { useRouter } from 'next/router';
import React from 'react';

import config from 'configs/app';
import useApiQuery from 'lib/api/useApiQuery';
import ValidatorsListItem from 'ui/validators/ValidatorsListItem';
import ValidatorsStats from 'ui/validators/ValidatorsStats';
import ActionBar from 'ui/shared/ActionBar';
import DataListDisplay from 'ui/shared/DataListDisplay';
import PageTitle from 'ui/shared/Page/PageTitle';
import useQueryWithPages from 'ui/shared/pagination/useQueryWithPages';
import StickyPaginationWithText from 'ui/shared/StickyPaginationWithText';

const Validators = () => {
  const router = useRouter();

  const validatorsQuery = useQueryWithPages({
    resourceName: 'validators:list',
    options: {
      enabled: config.features.validators.isEnabled,
      placeholderData: {
        items: [],
        next_page_params: null,
      },
    },
  });

  const countersQuery = useApiQuery('validators:counters', {
    queryOptions: {
      enabled: config.features.validators.isEnabled,
      refetchInterval: 30000, // Refetch every 30 seconds
      placeholderData: {
        total: 0,
        active_ongoing: 0,
        pending: 0,
        exited: 0,
        slashed: 0,
      },
    },
  });

  const content = validatorsQuery.data?.items ? (
    <>
      { validatorsQuery.data.items.map((item, index) => (
        <ValidatorsListItem
          key={ item.index }
          item={ item }
          isLoading={ validatorsQuery.isPlaceholderData }
        />
      )) }
    </>
  ) : null;

  const actionBar = (
    <ActionBar mt={ -6 }>
      <StickyPaginationWithText
        text="validators"
        pagination={ validatorsQuery.pagination }
      />
    </ActionBar>
  );

  return (
    <>
      <PageTitle
        title="Beacon Chain Validators"
        withTextAd
      />

      <ValidatorsStats counters={ countersQuery.data } isLoading={ countersQuery.isLoading }/>

      <DataListDisplay
        isError={ validatorsQuery.isError }
        itemsNum={ validatorsQuery.data?.items?.length }
        emptyText="There are no validators."
        actionBar={ actionBar }
      >
        { content }
      </DataListDisplay>
    </>
  );
};

export default Validators;
