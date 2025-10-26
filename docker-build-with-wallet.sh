#!/bin/bash

# Build Blockscout frontend with wallet connection enabled
# This script includes all necessary environment variables for blockchain interaction

echo "Building Blockscout frontend with wallet connection support..."

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
  -t roax/blockscout-frontend:validator-wallet .

echo "Build complete! The wallet connect button should now appear in the top bar."
echo ""
echo "To run the container:"
echo "docker run -p 3000:3000 roax/blockscout-frontend:validator-wallet"