# Validators API Debug Guide

## Overview

The validators feature in Blockscout frontend requires proper configuration to make API calls. This guide explains how the validators API is configured and common issues that prevent API calls.

## Key Findings

### 1. Validators Feature Configuration

The validators feature is controlled by the `NEXT_PUBLIC_VALIDATORS_CHAIN_TYPE` environment variable. Valid values are:
- `beacon` - Uses the generic validators page (`ui/pages/Validators.tsx`)
- `stability` - Uses chain-specific page (`ui/pages/ValidatorsStability.tsx`)
- `blackfort` - Uses chain-specific page (`ui/pages/ValidatorsBlackfort.tsx`)  
- `zilliqa` - Uses chain-specific page (`ui/pages/ValidatorsZilliqa.tsx`)

### 2. API Configuration Issue

The validators API endpoints are defined in `lib/api/services/validators.ts`:
- List endpoint: `/api/v2/validators/beacon`
- Counters endpoint: `/api/v2/validators/beacon/counters`

However, the validators API is not explicitly configured in `configs/app/apis.ts`. This causes the API calls to fall back to the general API configuration.

### 3. Fixed API Resolution

Updated `lib/api/getResourceParams.ts` to properly handle validators API by falling back to the general API configuration when validators API is not explicitly defined.

## API Call Flow

1. **useApiQuery Hook**: Called with resource name (e.g., `validators:list`)
2. **getResourceParams**: Resolves the API configuration
   - Now properly falls back to general API for validators
3. **buildUrl**: Constructs the full URL using the API endpoint and resource path
4. **useApiFetch**: Makes the actual HTTP request

## Required Environment Variables

```bash
# Enable validators feature (use "beacon" for generic validators)
export NEXT_PUBLIC_VALIDATORS_CHAIN_TYPE="beacon"

# API configuration (required for all API calls)
export NEXT_PUBLIC_API_HOST="your-api-host.com"
export NEXT_PUBLIC_API_PROTOCOL="https"  # optional, defaults to https
export NEXT_PUBLIC_API_BASE_PATH=""      # optional
```

## Testing

### 1. Run the Debug Script
```bash
node debug-validators.js
```

This will show:
- Current environment variable values
- Whether validators feature is enabled
- Expected API URLs

### 2. Use the Test Page
Navigate to `/test-validators` in your browser to see:
- Feature configuration
- API configuration
- Actual API calls and responses
- Any errors that occur

## Common Issues

### Issue: API calls not happening
**Cause**: `NEXT_PUBLIC_VALIDATORS_CHAIN_TYPE` not set or invalid value
**Solution**: Set the environment variable to a valid chain type

### Issue: 404 errors on API calls
**Cause**: Backend doesn't have validators endpoints at `/api/v2/validators/beacon`
**Solution**: Ensure backend supports these endpoints or check the API path

### Issue: API config not found error
**Cause**: Validators API not in apis configuration
**Solution**: Applied fix to `getResourceParams.ts` to use general API as fallback

## Code Locations

- **Feature Config**: `configs/app/features/validators.ts`
- **API Resources**: `lib/api/services/validators.ts`
- **API Config**: `configs/app/apis.ts`
- **Resource Resolution**: `lib/api/getResourceParams.ts` (fixed)
- **Main Page**: `ui/pages/Validators.tsx`
- **Router Page**: `pages/validators/index.tsx`