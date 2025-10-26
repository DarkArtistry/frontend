import { Box, Grid, Skeleton, Text } from '@chakra-ui/react';
import { useRouter } from 'next/router';
import React from 'react';

import type { TabItemRegular } from 'toolkit/components/AdaptiveTabs/types';

import useApiQuery from 'lib/api/useApiQuery';
import getQueryParamString from 'lib/router/getQueryParamString';
import RoutedTabs from 'toolkit/components/RoutedTabs/RoutedTabs';
import ValidatorInfo from 'ui/validators/ValidatorInfo';
import TextSeparator from 'ui/shared/TextSeparator';
import PageTitle from 'ui/shared/Page/PageTitle';

const TAB_LIST_PROPS = {
  marginBottom: 0,
  pt: 6,
  pb: 6,
  marginTop: -5,
};

const ValidatorDetails = () => {
  const router = useRouter();
  const index = getQueryParamString(router.query.id);

  const validatorQuery = useApiQuery('validators:item', {
    pathParams: { index },
    queryOptions: {
      enabled: Boolean(index),
    },
  });

  const tabs: Array<TabItemRegular> = [
    { id: 'index', title: 'Details', component: <ValidatorInfo data={ validatorQuery.data }/> },
  ];

  return (
    <>
      <PageTitle
        title={ `Validator #${ index }` }
        isLoading={ validatorQuery.isPlaceholderData }
        contentAfter={
          validatorQuery.data ? (
            <Box>
              <Text fontSize="sm" color="text_secondary" fontWeight={ 400 }>
                Status
              </Text>
              <Text fontSize="sm" fontWeight={ 600 }>
                { validatorQuery.data.status }
              </Text>
            </Box>
          ) : null
        }
      />

      <RoutedTabs
        tabs={ tabs }
        listProps={ TAB_LIST_PROPS }
        rightSlot={ null }
        stickyEnabled={ false }
      />
    </>
  );
};

export default ValidatorDetails;
