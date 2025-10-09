# Cosmos Chain Wallet Checker

A simple web-based tool to check wallet balances for any Cosmos-based blockchain at specific block heights.

## 🚀 Live Demo

**Try it now:** [https://jasbanza.github.io/cosmos-chain-wallet-checker/](https://jasbanza.github.io/cosmos-chain-wallet-checker/)

## Features

- 🔍 Check wallet balances at any block height or date/time
- 🌐 Support for all chains in the Cosmos Chain Registry
- 💎 Display pretty asset names (not just denoms)
- ⏱️ Select specific block height or use date/time picker
- 📊 Shows actual block height used for the query
- 🎨 Clean, responsive UI
- 🤖 **Auto-detect chain from wallet address** (e.g., `osmo1...` → Osmosis)
- 🔗 **URL parameter support** for deep linking (`?wallet=osmo1...`)
- ⚡ **Async JavaScript** - no page reloads, smooth UX

## Usage

### Basic Usage

1. Open `index.html` in your web browser (or navigate to http://localhost:3000)
2. Enter a wallet address (e.g., `osmo1vwrruj48vk8q49a7g8z08284wlvm9s6el6c7ej`)
3. **Chain is automatically detected** from the wallet prefix
4. Optionally:
   - Enter a specific block height, OR
   - Select a date/time using the date picker
   - Leave both empty to get the latest balance
5. Click "Check Balance"

### Direct Link with Wallet Address

You can share a direct link with a wallet address:
```
http://localhost:3000?wallet=osmo1vwrruj48vk8q49a7g8z08284wlvm9s6el6c7ej
```

The chain will be auto-detected and pre-selected.

### Supported Chain Prefixes

The following wallet prefixes are automatically detected:
- `cosmos1...` → Cosmos Hub
- `osmo1...` → Osmosis
- `juno1...` → Juno
- `stars1...` → Stargaze
- `inj1...` → Injective
- `akash1...` → Akash
- `secret1...` → Secret Network
- `celestia1...` → Celestia
- `dydx1...` → dYdX
- `neutron1...` → Neutron

## How It Works

The application:
- Fetches chain information from the [Cosmos Chain Registry](https://cosmos.directory)
- Queries the blockchain's RPC endpoint for balance information
- Resolves asset denoms to human-readable names using the chain's asset list
- Displays balances with proper decimal formatting based on asset specifications

## Local Development

### Using Node.js Server (Recommended)

The application includes a Node.js proxy server to handle CORS issues with blockchain APIs:

```bash
# Clone the repository
git clone https://github.com/jasbanza/cosmos-chain-wallet-checker.git
cd cosmos-chain-wallet-checker

# Install dependencies (none required, uses Node.js built-in modules)
# Start the server
npm start
# or
node server.js
```

Then navigate to `http://localhost:3000`

### Static File Server

You can also open `index.html` directly in a browser, but you may encounter CORS issues when fetching data from blockchain APIs. For the best experience, use the Node.js server.

## Technical Details

- Pure HTML/CSS/JavaScript (no frameworks required)
- Uses the Cosmos Chain Registry API
- Queries blockchain RPC endpoints directly
- Handles protobuf response parsing for balance queries

## Browser Compatibility

Works on all modern browsers that support:
- Fetch API
- ES6+ JavaScript
- CSS Grid/Flexbox

## Future Enhancements

- Wallet connect integration using [Quirks](https://quirks.nabla.studio/)
- Historical balance charts
- Export balance history to CSV
- Multi-chain balance aggregation

## License

MIT
