import React, { useCallback } from 'react';
import { Button, Text, HStack } from '@chakra-ui/react';
import { useAccount, useDisconnect } from 'wagmi';
import { toaster } from 'toolkit/chakra/toaster';
import { PopoverRoot, PopoverTrigger, PopoverContent, PopoverBody } from 'toolkit/chakra/popover';
import { useDisclosure } from 'toolkit/hooks/useDisclosure';
import IconSvg from 'ui/shared/IconSvg';

import config from 'configs/app';

// Conditional import to avoid errors when Web3 is not enabled
const useAppKitSafe = () => {
  try {
    // Only use AppKit if blockchain interaction is enabled
    if (!config.features.blockchainInteraction.isEnabled) {
      return null;
    }
    const { useAppKit } = require('@reown/appkit/react');
    return useAppKit();
  } catch (error) {
    return null;
  }
};

const WalletConnect: React.FC = () => {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const appKit = useAppKitSafe();
  const popover = useDisclosure();

  const handleConnectWallet = useCallback(() => {
    if (appKit?.open) {
      appKit.open();
    } else {
      toaster.create({
        title: 'Web3 not configured',
        description: 'Please ensure Web3 is properly configured',
        type: 'error',
      });
    }
  }, [appKit]);

  // Check if Web3 features are enabled
  const isWeb3Enabled = config.features.blockchainInteraction.isEnabled;

  if (!isWeb3Enabled) {
    return null; // Don't render if Web3 is not enabled
  }

  if (!isConnected) {
    return (
      <Button
        size="sm"
        onClick={handleConnectWallet}
        variant="outline"
        colorScheme="blue"
      >
        <HStack gap={1}>
          <IconSvg name="wallet" boxSize={4} />
          <Text>Connect Wallet</Text>
        </HStack>
      </Button>
    );
  }

  return (
    <PopoverRoot
      positioning={{ placement: 'bottom-start' }}
      open={popover.open}
      onOpenChange={popover.onOpenChange}
    >
      <PopoverTrigger>
        <Button
          size="sm"
          variant="outline"
          colorScheme="green"
        >
          <HStack gap={1}>
            <IconSvg name="wallet" boxSize={4} />
            <Text>{address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Connected'}</Text>
          </HStack>
        </Button>
      </PopoverTrigger>
      <PopoverContent w="auto" fontSize="sm">
        <PopoverBody>
          <HStack gap={4} p={2}>
            <Text fontSize="sm" fontWeight="medium">
              Connected: {address ? `${address.slice(0, 10)}...${address.slice(-8)}` : 'Unknown'}
            </Text>
            <Button 
              size="sm" 
              colorScheme="red" 
              variant="ghost"
              onClick={() => {
                disconnect();
                popover.onClose();
              }}
            >
              Disconnect
            </Button>
          </HStack>
        </PopoverBody>
      </PopoverContent>
    </PopoverRoot>
  );
};

export default React.memo(WalletConnect);