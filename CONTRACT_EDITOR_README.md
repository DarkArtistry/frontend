# Contract Editor - Real Solidity Compilation with OpenZeppelin

## Overview

This contract editor provides a **Remix-like IDE experience** with:
- ✅ Real Solidity compilation (not mock bytecode)
- ✅ OpenZeppelin imports support
- ✅ Multi-file projects with file tree
- ✅ Auto-compile on save
- ✅ Deploy with Wagmi/Viem
- ✅ Blockscout integration for transaction notifications

## Key Features

### 1. **Real Solidity Compiler**
- Uses `soljson` directly in the browser
- Compiles to actual deployable bytecode
- Full ABI generation with method selectors
- Support for Solidity 0.8.26

### 2. **OpenZeppelin Import Resolution**
- Automatically fetches contracts from GitHub
- Supports both regular and upgradeable contracts:
  - `@openzeppelin/contracts/...`
  - `@openzeppelin/contracts-upgradeable/...`
- Caches imports for faster compilation

### 3. **Contract Templates**
- **USDC Stablecoin (Upgradeable)**: Full implementation with proxy pattern
- **Simple ERC20 Token**: Basic token with minting and burning

## How It Works

### Compilation Process
1. When you click "Compile", the editor:
   - Loads the Solidity compiler in your browser
   - Scans your code for imports
   - Fetches OpenZeppelin contracts from GitHub
   - Compiles everything together
   - Returns real bytecode and ABI

### Import Resolution
```solidity
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
// Fetches from: https://raw.githubusercontent.com/OpenZeppelin/openzeppelin-contracts/v5.0.0/contracts/token/ERC20/ERC20.sol
```

### Deployment
1. Connect your wallet
2. Select compiled contract
3. Enter constructor parameters
4. Deploy with real bytecode
5. Get Blockscout notification on success

## Usage Examples

### Simple ERC20 Token
```solidity
// Uses the template: Click 📄 → "Simple ERC20 Token"
contract MyToken is ERC20, ERC20Burnable, Ownable {
    constructor(string memory name, string memory symbol, uint256 initialSupply) 
        ERC20(name, symbol) 
        Ownable(msg.sender) 
    {
        _mint(msg.sender, initialSupply * 10 ** decimals());
    }
}
```

### USDC Implementation
```solidity
// Full USDC with upgradeability, role-based access, blacklisting
contract USDC is Initializable, ERC20Upgradeable, AccessControlUpgradeable, UUPSUpgradeable {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    // ... full implementation
}
```

## CSP Configuration

The editor requires these CSP policies:
```javascript
'script-src': ['unsafe-eval', 'binaries.soliditylang.org', 'unpkg.com']
'connect-src': ['raw.githubusercontent.com', 'binaries.soliditylang.org']
```

## Troubleshooting

### "Failed to load compiler"
- Check browser console for CSP errors
- Ensure `unsafe-eval` is enabled in CSP
- Try refreshing the page

### "Import not found"
- OpenZeppelin contracts are fetched from GitHub
- Check your internet connection
- Verify import path is correct

### "Compilation failed"
- Check Solidity syntax
- Ensure pragma version matches (0.8.20+)
- Look at compiler errors in output panel

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   File Tree     │────▶│  Monaco Editor   │────▶│  Real Compiler  │
│  (Templates)    │     │   (Solidity)     │     │   (soljson)     │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                │                          │
                                ▼                          ▼
                        ┌──────────────────┐     ┌─────────────────┐
                        │  Deploy Panel    │◀────│  GitHub CDN     │
                        │   (Wagmi)        │     │  (OpenZeppelin) │
                        └──────────────────┘     └─────────────────┘
```

## Future Improvements

1. **Import from NPM**: Extend to support more packages
2. **Solidity Language Server**: Add autocomplete and go-to-definition
3. **Debugger Integration**: Step through transactions
4. **Gas Estimation**: Show deployment and function costs
5. **Multi-chain Deployment**: Deploy to multiple networks at once

## Comparison with Mock Compiler

| Feature | Real Compiler | Mock Compiler |
|---------|---------------|---------------|
| Bytecode | ✅ Deployable | ❌ Fake |
| ABI | ✅ Accurate | ❌ Guessed |
| Imports | ✅ OpenZeppelin | ❌ None |
| Deploy | ✅ On-chain | ❌ Fails |
| Gas costs | ✅ Real | ❌ N/A |

This is a **production-ready** contract editor suitable for real dApp development!