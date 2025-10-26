# Simple Blockscout SDK Integration Plan

## Goal
Replace our current custom toast notifications with the official Blockscout SDK for better transaction handling.

## What We Currently Have
- Custom Chakra UI toasts for transaction notifications
- Manual transaction monitoring in contract deployment
- Basic error handling

## What We Want
- Automatic transaction notifications with the SDK
- Better transaction status tracking
- Transaction history popup

## Simple Integration Steps

### Step 1: Install SDK
```bash
npm install @blockscout/app-sdk
```

### Step 2: Setup Providers
Add SDK providers to our app root:

```typescript
// ui/shared/AppProviders.tsx - Add to existing providers
import { NotificationProvider, TransactionPopupProvider } from '@blockscout/app-sdk';

const config = {
  chains: [{ id: 135, name: 'ROAX', explorerUrl: 'https://explorer.roax.network' }]
};

// Wrap existing providers
<NotificationProvider config={config}>
  <TransactionPopupProvider>
    {/* existing providers */}
  </TransactionPopupProvider>
</NotificationProvider>
```

### Step 3: Replace Toast Notifications
In contract deployment (`ui/contractEditor/DeployPanel.tsx`):

```typescript
// Replace this:
toaster.create({
  title: 'Transaction submitted',
  type: 'info'
});

// With this:
import { useNotification } from '@blockscout/app-sdk';
const { showNotification } = useNotification();

showNotification(transactionHash, { chainId: 135 });
```

### Step 4: Add Transaction History
Add a simple button for transaction history:

```typescript
import { useTransactionPopup } from '@blockscout/app-sdk';

const { openPopup } = useTransactionPopup();

<Button onClick={() => openPopup({ chainId: 135 })}>
  Transaction History
</Button>
```

## That's It!

### Benefits We Get:
- ✅ Automatic transaction status tracking
- ✅ Better error messages  
- ✅ Transaction history popup
- ✅ Less code to maintain

### Files to Change:
1. `ui/shared/AppProviders.tsx` - Add SDK providers
2. `ui/contractEditor/DeployPanel.tsx` - Replace toasts
3. Add transaction history button where needed

### Test Plan:
1. Deploy a contract - check notifications work
2. Open transaction history popup 
3. Test error cases
4. Verify everything still works as before