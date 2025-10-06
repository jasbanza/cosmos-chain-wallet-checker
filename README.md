# Cosmos Chain Wallet Checker

A simple web-based tool to check wallet balances for any Cosmos-based blockchain at specific block heights.

## Features

- 🔍 Check wallet balances at any block height or date/time
- 🌐 Support for all chains in the Cosmos Chain Registry
- 💎 Display pretty asset names (not just denoms)
- ⏱️ Select specific block height or use date/time picker
- 📊 Shows actual block height used for the query
- 🎨 Clean, responsive UI

## Usage

1. Open `index.html` in your web browser
2. Enter a wallet address (e.g., `cosmos1...`)
3. Select a chain from the dropdown menu
4. Optionally:
   - Enter a specific block height, OR
   - Select a date/time using the date picker
   - Leave both empty to get the latest balance
5. Click "Check Balance"

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
