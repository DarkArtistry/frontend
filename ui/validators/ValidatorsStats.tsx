import { Grid, Skeleton } from '@chakra-ui/react';
import React from 'react';

import type { ValidatorCounters } from 'lib/api/services/validators';

import StatsWidget from 'ui/shared/stats/StatsWidget';

interface Props {
  counters?: ValidatorCounters;
  isLoading?: boolean;
}

const ValidatorsStats = ({ counters, isLoading }: Props) => {
  if (isLoading || !counters) {
    return (
      <Grid
        gridTemplateColumns={{ lg: 'repeat(5, 1fr)', base: 'repeat(2, 1fr)' }}
        gridTemplateRows={{ lg: 'none', base: 'repeat(3, 1fr)' }}
        gridGap="10px"
        marginBottom={ 6 }
      >
        { Array.from({ length: 5 }).map((_, index) => <Skeleton key={ index } h="96px"/>) }
      </Grid>
    );
  }

  return (
    <Grid
      gridTemplateColumns={{ lg: 'repeat(5, 1fr)', base: 'repeat(2, 1fr)' }}
      gridTemplateRows={{ lg: 'none', base: 'repeat(3, 1fr)' }}
      gridGap="10px"
      marginBottom={ 6 }
    >
      <StatsWidget
        icon="validator"
        label="Total validators"
        value={ counters.total.toLocaleString() }
        isLoading={ false }
      />
      <StatsWidget
        icon="transactions_slim"
        label="Active"
        value={ counters.active_ongoing.toLocaleString() }
        isLoading={ false }
      />
      <StatsWidget
        icon="clock-light"
        label="Pending"
        value={ counters.pending.toLocaleString() }
        isLoading={ false }
      />
      <StatsWidget
        icon="block_slim"
        label="Exited"
        value={ counters.exited.toLocaleString() }
        isLoading={ false }
      />
      <StatsWidget
        icon="gas"
        label="Slashed"
        value={ counters.slashed.toLocaleString() }
        isLoading={ false }
      />
    </Grid>
  );
};

export default ValidatorsStats;
