import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  Box,
  VStack,
  Text,
  Button,
  Input,
  Link,
  HStack,
  Spinner,
  Accordion,
  createListCollection,
} from '@chakra-ui/react';
import { Field } from 'toolkit/chakra/field';
import { Select } from 'toolkit/chakra/select';
import { toaster } from 'toolkit/chakra/toaster';
import { AccordionItemTrigger } from 'toolkit/chakra/accordion';
// ETHGlobal: Dynamic import with fallback for Blockscout SDK
let useNotification: any;
let useTransactionPopup: any;

try {
  const sdk = require('@blockscout/app-sdk');
  useNotification = sdk.useNotification;
  useTransactionPopup = sdk.useTransactionPopup;
} catch (e) {
  // Fallback to mock if real SDK not installed
  const mockSdk = require('lib/blockscout-sdk/mock-sdk');
  useNotification = mockSdk.useNotification;
  useTransactionPopup = mockSdk.useTransactionPopup;
}
import { useAccount, useDisconnect, useWaitForTransactionReceipt, useSendTransaction } from 'wagmi';
import { parseEther, encodeFunctionData } from 'viem';
import { FiExternalLink } from 'react-icons/fi';
import { IconButton } from 'toolkit/chakra/icon-button';
import { useColorModeValue } from 'toolkit/chakra/color-mode';

import config from 'configs/app';
import type { CompileResult } from 'lib/contractEditor/webWorkerCompiler';

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

interface DeployPanelProps {
  compileResult?: CompileResult;
  isCompiling: boolean;
  onCompile: () => void;
}

interface ConstructorInput {
  name: string;
  type: string;
  value: string;
}

const DeployPanel: React.FC<DeployPanelProps> = ({
  compileResult,
  isCompiling,
  onCompile,
}) => {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const appKit = useAppKitSafe();
  // Use the appropriate method based on SDK version
  const notificationHook = useNotification();
  const openTxToast = notificationHook.openTxToast || notificationHook.showNotification;
  const { openPopup } = useTransactionPopup();
  
  const [selectedContract, setSelectedContract] = useState<string>('');
  const [constructorInputs, setConstructorInputs] = useState<ConstructorInput[]>([]);
  const [deployValue, setDeployValue] = useState('0');
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployedAddress, setDeployedAddress] = useState<string>('');

  const { sendTransactionAsync, data: txData } = useSendTransaction();
  const { data: receipt, isLoading: isWaitingReceipt } = useWaitForTransactionReceipt({
    hash: txData as `0x${string}` | undefined,
  });

  const bgColor = useColorModeValue('gray.50', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Get available contracts from compile result
  const availableContracts = useMemo(() => {
    if (!compileResult?.contracts) return [];
    return Object.keys(compileResult.contracts);
  }, [compileResult]);

  // Check if selected contract constructor is payable
  const isConstructorPayable = useMemo(() => {
    if (!selectedContract || !compileResult?.contracts?.[selectedContract]) return false;
    
    const abi = compileResult.contracts[selectedContract].abi;
    const constructor = abi.find((item: any) => item.type === 'constructor') as { 
      stateMutability?: string;
    } | undefined;
    
    return constructor?.stateMutability === 'payable';
  }, [selectedContract, compileResult]);

  // Update constructor inputs when contract selection changes
  const handleContractSelect = useCallback((contractName: string) => {
    setSelectedContract(contractName);
    setConstructorInputs([]);
    setDeployValue('0'); // Reset deploy value when changing contracts
    
    if (compileResult?.contracts?.[contractName]) {
      const abi = compileResult.contracts[contractName].abi;
      const constructor = abi.find((item: any) => item.type === 'constructor') as { inputs?: Array<{ name?: string; type: string }> } | undefined;
      
      if (constructor?.inputs) {
        setConstructorInputs(
          constructor.inputs.map((input, idx) => ({
            name: input.name || `param${idx}`,
            type: input.type,
            value: '',
          }))
        );
      }
    }
  }, [compileResult]);

  const handleInputChange = useCallback((index: number, value: string) => {
    setConstructorInputs(prev => {
      const updated = [...prev];
      updated[index].value = value;
      return updated;
    });
  }, []);

  const handleDeploy = useCallback(async () => {
    if (!selectedContract || !compileResult?.contracts?.[selectedContract]) {
      // Show regular toast for errors since SDK only handles transaction hashes
      toaster.create({
        title: 'Deployment Error',
        description: 'Please select a contract to deploy',
        type: 'error',
      });
      return;
    }

    setIsDeploying(true);
    setDeployedAddress('');

    try {
      const contract = compileResult.contracts[selectedContract];
      const { bytecode, abi } = contract;

      // Prepare constructor arguments
      let deployBytecode = bytecode;
      
      if (constructorInputs.length > 0) {
        const constructor = abi.find((item: any) => item.type === 'constructor');
        if (constructor) {
          // Encode constructor arguments
          const encodedArgs = encodeFunctionData({
            abi: [constructor],
            functionName: 'constructor',
            args: constructorInputs.map(input => {
              // Handle different types
              if (input.type.startsWith('uint') || input.type.startsWith('int')) {
                return BigInt(input.value);
              } else if (input.type === 'bool') {
                return input.value.toLowerCase() === 'true';
              } else if (input.type.startsWith('address')) {
                return input.value as `0x${string}`;
              } else if (input.type.startsWith('bytes')) {
                return input.value.startsWith('0x') ? input.value : `0x${input.value}`;
              }
              return input.value;
            }),
          });
          
          // Remove function selector (first 4 bytes) from encoded args
          const argsWithoutSelector = encodedArgs.slice(10); // '0x' + 8 hex chars
          deployBytecode = bytecode + argsWithoutSelector;
        }
      }

      // Check if constructor is payable before sending value
      const contractAbi = compileResult.contracts[selectedContract].abi;
      const constructor = contractAbi.find((item: any) => item.type === 'constructor') as { 
        inputs?: Array<{ name?: string; type: string }>; 
        stateMutability?: string;
      } | undefined;
      
      const isPayable = constructor?.stateMutability === 'payable';
      const hasValue = deployValue && deployValue !== '0' && parseFloat(deployValue) > 0;
      
      if (hasValue && !isPayable) {
        throw new Error('Cannot send ETH to non-payable constructor');
      }

      const value = hasValue && isPayable ? parseEther(deployValue) : undefined;

      const hash = await sendTransactionAsync({
        data: `0x${deployBytecode}` as `0x${string}`,
        value,
        to: undefined,
      });

      // Use Blockscout SDK for transaction notifications
      if (notificationHook.openTxToast) {
        // Real SDK API
        openTxToast('135', hash);
      } else {
        // Mock SDK API
        openTxToast(hash, {
          chainId: 135,
          pending: {
            title: 'Contract Deployment Submitted',
            description: 'Your contract deployment is being processed...',
          },
          success: {
            title: 'Contract Deployed Successfully',
            description: 'Your smart contract has been deployed to the blockchain.',
          },
          error: {
            title: 'Deployment Failed',
            description: 'Contract deployment failed. Please try again.',
          },
        });
      }
    } catch (error: any) {
      // For errors, show a regular toast since SDK only handles transaction hashes
      toaster.create({
        title: 'Deployment Failed',
        description: error.message || 'Unknown error occurred during deployment',
        type: 'error',
      });
      setIsDeploying(false);
    }
  }, [selectedContract, compileResult, constructorInputs, deployValue, sendTransactionAsync, showNotification]);

  // Handle successful deployment
  React.useEffect(() => {
    if (receipt?.contractAddress) {
      setDeployedAddress(receipt.contractAddress);
      setIsDeploying(false);
      toaster.create({
        title: 'Contract deployed!',
        description: `Contract address: ${receipt.contractAddress}`,
        type: 'success',
      });
    }
  }, [receipt]);

  const handleConnectWallet = useCallback(() => {
    if (appKit?.open) {
      appKit.open();
    } else {
      // Fallback if AppKit is not available
      toaster.create({
        title: 'Web3 Features Not Available',
        description: 'Please ensure Web3 is properly configured',
        type: 'error',
      });
    }
  }, [appKit]);

  // Check if Web3 features are enabled
  const isWeb3Enabled = config.features.blockchainInteraction.isEnabled;

  return (
    <VStack align="stretch" gap={ 4 } h="full">
      <Box>
        <Text fontSize="lg" fontWeight="bold" mb={ 2 }>Deploy & Run</Text>
        
        
        {/* Wallet Connection */}
        { !isWeb3Enabled ? (
          <Box p={ 4 } bg={ bgColor } borderRadius="md" textAlign="center">
            <Text fontSize="sm" color="gray.500">
              Web3 features are not enabled. Please configure blockchain interaction to deploy contracts.
            </Text>
          </Box>
        ) : !isConnected ? (
          <Button
            colorScheme="blue"
            onClick={ handleConnectWallet }
            width="full"
          >
            Connect Wallet
          </Button>
        ) : (
          <VStack align="stretch" gap={ 2 }>
            <HStack justify="space-between">
              <Text fontSize="sm">Connected:</Text>
              <Text fontSize="sm" fontFamily="mono" truncate maxW="150px">
                { address }
              </Text>
            </HStack>
            <HStack gap={ 2 }>
              <Button size="sm" variant="outline" onClick={ () => disconnect() } flex="1">
                Disconnect
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={ () => openPopup({ chainId: 135 }) }
                flex="1"
              >
                Transaction History
              </Button>
            </HStack>
          </VStack>
        )}
      </Box>

      <Box w="100%" borderBottomWidth="1px" borderBottomColor="gray.200" my={ 4 }/>

      {/* Compile Button */}
      <Button
        colorScheme="green"
        onClick={ onCompile }
        loading={ isCompiling }
      >
        Compile Contract
      </Button>

      { compileResult?.success && availableContracts.length > 0 && (
        <>
          <Box w="100%" borderBottomWidth="1px" borderBottomColor="gray.200" my={ 4 }/>
          
          {/* Contract Selection */}
          <Field label="Contract" size="sm">
            <Select
              placeholder="Select contract"
              value={ selectedContract ? [selectedContract] : [] }
              onValueChange={ ({ value }) => handleContractSelect(value[0] || '') }
              size="sm"
              required
              collection={ createListCollection({ items: availableContracts.map(name => ({ label: name, value: name })) }) }
            />
          </Field>

          { selectedContract && (
            <>
              {/* Constructor Parameters */}
              { constructorInputs.length > 0 && (
                <Accordion.Root collapsible>
                  <Accordion.Item value="constructor">
                    <AccordionItemTrigger>
                      <Text fontSize="sm">Constructor Parameters</Text>
                      <Accordion.ItemIndicator/>
                    </AccordionItemTrigger>
                    <Accordion.ItemContent>
                      <VStack align="stretch" gap={ 2 }>
                        { constructorInputs.map((input, index) => (
                          <Field 
                            key={ index }
                            label={ `${input.name} (${input.type})` }
                            size="sm"
                          >
                            <Input
                              size="sm"
                              value={ input.value }
                              onChange={ (e) => handleInputChange(index, e.target.value) }
                              placeholder={ `Enter ${input.type}` }
                            />
                          </Field>
                        ))}
                      </VStack>
                    </Accordion.ItemContent>
                  </Accordion.Item>
                </Accordion.Root>
              )}

              {/* Deploy Value */}
              <Field 
                label={ isConstructorPayable ? "Value (ETH)" : "Value (ETH) - Constructor not payable" }
                size="sm"
              >
                <Input
                  size="sm"
                  value={ deployValue }
                  onChange={ (e) => setDeployValue(e.target.value) }
                  placeholder="0"
                  disabled={ !isConstructorPayable }
                  opacity={ isConstructorPayable ? 1 : 0.6 }
                />
              </Field>

              {/* Deploy Button */}
              <Button
                colorScheme="blue"
                onClick={ handleDeploy }
                loading={ isDeploying || isWaitingReceipt }
                width="full"
              >
                Deploy
              </Button>

              {/* Deployed Contract Address */}
              { deployedAddress && (
                <Box
                  p={ 3 }
                  bg={ bgColor }
                  borderRadius="md"
                  border="1px solid"
                  borderColor={ borderColor }
                >
                  <Text fontSize="sm" fontWeight="bold" mb={ 1 }>
                    Deployed Contract
                  </Text>
                  <HStack>
                    <Text fontSize="xs" fontFamily="mono" truncate>
                      { deployedAddress }
                    </Text>
                    <Link href={ `/address/${deployedAddress}` }>
                      <IconButton
                        aria-label="View on explorer"
                        size="2xs"
                        variant="ghost"
                      >
                        <FiExternalLink/>
                      </IconButton>
                    </Link>
                  </HStack>
                </Box>
              )}
            </>
          )}
        </>
      )}

      {/* Compiler Errors */}
      { compileResult?.errors && compileResult.errors.length > 0 && (
        <Box
          p={ 3 }
          bg={ useColorModeValue('red.50', 'red.900') }
          borderRadius="md"
          maxH="200px"
          overflowY="auto"
        >
          <Text fontSize="sm" fontWeight="bold" mb={ 2 }>
            Compiler Messages
          </Text>
          { compileResult.errors.map((error, index) => (
            <Text
              key={ index }
              fontSize="xs"
              color={ error.severity === 'error' ? 'red.600' : 'orange.600' }
              mb={ 1 }
            >
              { error.formattedMessage }
            </Text>
          ))}
        </Box>
      )}
    </VStack>
  );
};

export default DeployPanel;