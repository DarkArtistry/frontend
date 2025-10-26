# Wallet Connect Setup Instructions

## Issue
The "Connect Wallet" button is not appearing next to the gear/settings icon because the `blockchainInteraction` feature is disabled.

## Location
- The wallet connection is implemented as a separate button in the TopBar, NOT inside the settings dropdown
- Component: `/ui/snippets/topBar/WalletConnect.tsx`
- It appears between DeFi dropdown and Settings button

## Requirements for Wallet Connect to Work

The `blockchainInteraction` feature requires:

1. **WalletConnect Project ID**: `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID` (already set in `.env.local`)
2. **Complete chain configuration**:
   - `NEXT_PUBLIC_NETWORK_ID` (already set: 135)
   - `NEXT_PUBLIC_NETWORK_NAME` (already set: ROAX)
   - `NEXT_PUBLIC_NETWORK_CURRENCY_NAME` (already set: PLASMA)
   - `NEXT_PUBLIC_NETWORK_CURRENCY_SYMBOL` (already set: PLASMA)
   - `NEXT_PUBLIC_NETWORK_CURRENCY_DECIMALS` (already set: 18)
   - `NEXT_PUBLIC_NETWORK_RPC_URL` (already set: https://devrpc.roax.network)

## Solution: Pass Environment Variables to Docker Build

When building with Docker, you need to pass these environment variables as build args:

```bash
docker build \
  --build-arg NEXT_PUBLIC_VALIDATORS_CHAIN_TYPE=beacon \
  --build-arg NEXT_PUBLIC_CONTRACT_EDITOR_ENABLED=true \
  --build-arg NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=859aacfad606ba81a2c8ffc1e140de29 \
  --build-arg NEXT_PUBLIC_NETWORK_ID=135 \
  --build-arg NEXT_PUBLIC_NETWORK_NAME=ROAX \
  --build-arg NEXT_PUBLIC_NETWORK_CURRENCY_NAME=PLASMA \
  --build-arg NEXT_PUBLIC_NETWORK_CURRENCY_SYMBOL=PLASMA \
  --build-arg NEXT_PUBLIC_NETWORK_CURRENCY_DECIMALS=18 \
  --build-arg NEXT_PUBLIC_NETWORK_RPC_URL=https://devrpc.roax.network \
  --no-cache \
  -t roax/blockscout-frontend:validator .
```

## Alternative: Create Docker Environment File

Create a `.env.docker` file:

```env
NEXT_PUBLIC_VALIDATORS_CHAIN_TYPE=beacon
NEXT_PUBLIC_CONTRACT_EDITOR_ENABLED=true
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=859aacfad606ba81a2c8ffc1e140de29
NEXT_PUBLIC_NETWORK_ID=135
NEXT_PUBLIC_NETWORK_NAME=ROAX
NEXT_PUBLIC_NETWORK_CURRENCY_NAME=PLASMA
NEXT_PUBLIC_NETWORK_CURRENCY_SYMBOL=PLASMA
NEXT_PUBLIC_NETWORK_CURRENCY_DECIMALS=18
NEXT_PUBLIC_NETWORK_RPC_URL=https://devrpc.roax.network
```

Then use docker-compose or pass env file during runtime.

## Features Enabled

Once properly configured, you'll have:
- ✅ Connect Wallet button in the top bar
- ✅ MetaMask and other wallet connections via WalletConnect
- ✅ Contract deployment from the Contract Editor
- ✅ Contract method execution from contract pages
- ✅ User authentication with wallet

## Testing

After building and running the Docker container, verify:
1. The "Connect Wallet" button appears in the top navigation
2. Clicking it opens the wallet connection modal
3. You can connect MetaMask to the ROAX network
4. After connecting, you can deploy contracts from the Contract Editor

## Note on ROAX Network in MetaMask

Users will need to add the ROAX network to MetaMask with these parameters:
- Network Name: ROAX
- RPC URL: https://devrpc.roax.network
- Chain ID: 135
- Currency Symbol: PLASMA
- Block Explorer URL: (your Blockscout instance URL)