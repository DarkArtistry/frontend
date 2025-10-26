import { Badge, Box, Flex, Grid, HStack, Text, VStack } from '@chakra-ui/react';
import React from 'react';

import type { Validator } from 'lib/api/services/validators';

import { Link } from 'toolkit/chakra/link';
import { Skeleton } from 'toolkit/chakra/skeleton';
import AddressEntity from 'ui/shared/entities/address/AddressEntity';
import ListItemMobile from 'ui/shared/ListItemMobile/ListItemMobile';

interface Props {
  item: Validator;
  isLoading?: boolean;
}

const ValidatorsListItem = ({ item, isLoading }: Props) => {
  const getStatusColor = () => {
    if (item.slashed) return 'red';
    if (item.status === 'active_ongoing') return 'green';
    if (item.status === 'pending') return 'yellow';
    if (item.status === 'withdrawal_done') return 'blue';
    if (item.status === 'exited') return 'gray';
    return 'gray';
  };
  
  const statusColorScheme = getStatusColor();
  
  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <ListItemMobile key={ item.index }>
      <VStack width="100%" alignItems="stretch" gap={ 3 }>
        {/* Header Row */}
        <Flex justifyContent="space-between" width="100%">
          <Box flexGrow={ 1 } overflow="hidden">
            <Flex columnGap={ 2 } alignItems="baseline">
              <Link
                href={ `/validators/${ item.index }` }
                fontSize="xl"
                fontWeight={ 700 }
                overflow="hidden"
                textOverflow="ellipsis"
              >
                <Skeleton loading={ isLoading } display="inline-block">
                  Validator #{ item.index }
                </Skeleton>
              </Link>
              <Skeleton loading={ isLoading }>
                <Badge
                  colorScheme={ statusColorScheme }
                  variant="subtle"
                  fontSize="xs"
                  px={ 2 }
                >
                  { formatStatus(item.status) }
                </Badge>
              </Skeleton>
            </Flex>
          </Box>
          <Box>
            <Skeleton loading={ isLoading }>
              <VStack alignItems="end" gap={ 0 }>
                <Text fontSize="lg" fontWeight={ 600 }>
                  { (Number(item.effective_balance) / 1e9).toFixed(2) } ETH
                </Text>
                { item.slashed && (
                  <Badge colorScheme="red" fontSize="xs">SLASHED</Badge>
                ) }
              </VStack>
            </Skeleton>
          </Box>
        </Flex>
        
        {/* Details Row */}
        <Grid templateColumns="repeat(2, 1fr)" gap={ 4 } fontSize="sm">
          <VStack alignItems="start" gap={ 1 }>
            <Text color="text_secondary" fontSize="xs">Public Key</Text>
            <Skeleton loading={ isLoading } display="inline-block">
              <Text fontFamily="mono" fontSize="xs">
                { item.pubkey.slice(0, 20) }...{ item.pubkey.slice(-10) }
              </Text>
            </Skeleton>
          </VStack>
          
          <VStack alignItems="start" gap={ 1 }>
            <Text color="text_secondary" fontSize="xs">Epochs</Text>
            <Skeleton loading={ isLoading } display="inline-block">
              <HStack gap={ 2 } fontSize="xs">
                <Text>
                  <Text as="span" color="text_secondary">Act:</Text> { item.activation_epoch || '-' }
                </Text>
                { item.exit_epoch && (
                  <Text>
                    <Text as="span" color="text_secondary">Exit:</Text> { item.exit_epoch }
                  </Text>
                ) }
              </HStack>
            </Skeleton>
          </VStack>
          
          { item.withdrawal_credentials && (
            <VStack alignItems="start" gap={ 1 }>
              <Text color="text_secondary" fontSize="xs">Withdrawal Credentials</Text>
              <Skeleton loading={ isLoading } display="inline-block">
                <Text fontFamily="mono" fontSize="xs">
                  { item.withdrawal_credentials.slice(0, 20) }...{ item.withdrawal_credentials.slice(-10) }
                </Text>
              </Skeleton>
            </VStack>
          ) }
          
          { item.last_attestation_slot !== null && (
            <VStack alignItems="start" gap={ 1 }>
              <Text color="text_secondary" fontSize="xs">Last Attestation</Text>
              <Skeleton loading={ isLoading } display="inline-block">
                <Text fontSize="xs">
                  Slot { item.last_attestation_slot }
                </Text>
              </Skeleton>
            </VStack>
          ) }
        </Grid>
      </VStack>
    </ListItemMobile>
  );
};

export default ValidatorsListItem;
