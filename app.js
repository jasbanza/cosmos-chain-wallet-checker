// Cosmos Chain Wallet Checker Application

class CosmosWalletChecker {
    constructor() {
        this.chains = [];
        this.selectedChain = null;
        this.init();
    }

    async init() {
        await this.loadChains();
        this.setupEventListeners();
    }

    async loadChains() {
        try {
            // Use a curated list of popular chains with their data
            // In production, this would fetch from chain registry
            this.chains = [
                {
                    chain_name: 'cosmoshub',
                    pretty_name: 'Cosmos Hub',
                    bech32_prefix: 'cosmos'
                },
                {
                    chain_name: 'osmosis',
                    pretty_name: 'Osmosis',
                    bech32_prefix: 'osmo'
                },
                {
                    chain_name: 'akash',
                    pretty_name: 'Akash',
                    bech32_prefix: 'akash'
                },
                {
                    chain_name: 'juno',
                    pretty_name: 'Juno',
                    bech32_prefix: 'juno'
                },
                {
                    chain_name: 'stargaze',
                    pretty_name: 'Stargaze',
                    bech32_prefix: 'stars'
                },
                {
                    chain_name: 'secretnetwork',
                    pretty_name: 'Secret Network',
                    bech32_prefix: 'secret'
                },
                {
                    chain_name: 'celestia',
                    pretty_name: 'Celestia',
                    bech32_prefix: 'celestia'
                },
                {
                    chain_name: 'injective',
                    pretty_name: 'Injective',
                    bech32_prefix: 'inj'
                },
                {
                    chain_name: 'dydx',
                    pretty_name: 'dYdX',
                    bech32_prefix: 'dydx'
                },
                {
                    chain_name: 'neutron',
                    pretty_name: 'Neutron',
                    bech32_prefix: 'neutron'
                }
            ];
            
            this.populateChainSelect();
        } catch (error) {
            console.error('Error loading chains:', error);
            this.showError('Failed to load chains. Please refresh the page.');
        }
    }

    populateChainSelect() {
        const select = document.getElementById('chainSelect');
        select.innerHTML = '<option value="">Select a chain...</option>';
        
        this.chains.forEach(chain => {
            const option = document.createElement('option');
            option.value = chain.chain_name;
            option.textContent = chain.pretty_name || chain.chain_name;
            select.appendChild(option);
        });
    }

    setupEventListeners() {
        const checkBtn = document.getElementById('checkBalanceBtn');
        const chainSelect = document.getElementById('chainSelect');
        
        checkBtn.addEventListener('click', () => this.handleCheckBalance());
        
        chainSelect.addEventListener('change', (e) => {
            const chainName = e.target.value;
            this.selectedChain = this.chains.find(c => c.chain_name === chainName);
        });
    }

    async handleCheckBalance() {
        const walletAddress = document.getElementById('walletAddress').value.trim();
        const blockHeight = document.getElementById('blockHeight').value.trim();
        const dateTime = document.getElementById('dateTime').value;

        if (!walletAddress) {
            this.showError('Please enter a wallet address.');
            return;
        }

        if (!this.selectedChain) {
            this.showError('Please select a chain.');
            return;
        }

        this.showLoading();
        this.hideError();
        this.hideResults();

        try {
            // Get REST endpoint for the selected chain
            const restEndpoint = this.getRESTEndpoint(this.selectedChain.chain_name);
            
            if (!restEndpoint) {
                throw new Error('No REST endpoint available for this chain');
            }

            let targetBlockHeight = blockHeight;

            // If date/time is provided instead of block height, find the closest block
            if (dateTime && !blockHeight) {
                targetBlockHeight = await this.findBlockByTimestamp(restEndpoint, dateTime);
            }

            // Fetch balances
            const balances = await this.fetchBalances(restEndpoint, walletAddress, targetBlockHeight);
            
            // Get the actual block height used
            const actualBlockHeight = targetBlockHeight || await this.getLatestBlockHeight(restEndpoint);
            
            // Get asset info for pretty names
            const assetsInfo = await this.getAssetsInfo(this.selectedChain.chain_name);
            
            // Display results
            this.displayResults(balances, actualBlockHeight, assetsInfo);
        } catch (error) {
            console.error('Error:', error);
            this.showError(`Error: ${error.message}`);
        } finally {
            this.hideLoading();
        }
    }

    getRESTEndpoint(chainName) {
        // Use local proxy server to avoid CORS issues
        // In production, this would be configured differently
        return `/api/${chainName}`;
    }

    async getLatestBlockHeight(restEndpoint) {
        const response = await fetch(`${restEndpoint}/cosmos/base/tendermint/v1beta1/blocks/latest`);
        const data = await response.json();
        return data.block.header.height;
    }

    async findBlockByTimestamp(restEndpoint, dateTimeString) {
        const targetTimestamp = new Date(dateTimeString).getTime();
        
        // Get latest block to start estimation
        const latestHeight = await this.getLatestBlockHeight(restEndpoint);
        
        // Get latest block info
        const latestBlockResponse = await fetch(`${restEndpoint}/cosmos/base/tendermint/v1beta1/blocks/latest`);
        const latestBlockData = await latestBlockResponse.json();
        const latestTimestamp = new Date(latestBlockData.block.header.time).getTime();
        
        if (targetTimestamp > latestTimestamp) {
            throw new Error('Selected date/time is in the future');
        }
        
        // Estimate block time (average ~6 seconds for most Cosmos chains)
        const avgBlockTime = 6000; // milliseconds
        const timeDiff = latestTimestamp - targetTimestamp;
        const blocksDiff = Math.floor(timeDiff / avgBlockTime);
        const estimatedHeight = Math.max(1, parseInt(latestHeight) - blocksDiff);
        
        return estimatedHeight.toString();
    }

    async fetchBalances(restEndpoint, address, blockHeight) {
        let url = `${restEndpoint}/cosmos/bank/v1beta1/balances/${address}`;
        
        if (blockHeight) {
            url += `?height=${blockHeight}`;
        }
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.code) {
            throw new Error(data.message || 'Failed to fetch balances');
        }
        
        return data.balances || [];
    }

    async getAssetsInfo(chainName) {
        try {
            // Fetch from GitHub chain registry
            const response = await fetch(`https://raw.githubusercontent.com/cosmos/chain-registry/master/${chainName}/assetlist.json`);
            const data = await response.json();
            
            const assetsMap = {};
            if (data.assets) {
                data.assets.forEach(asset => {
                    const baseDenom = asset.base || asset.denom;
                    assetsMap[baseDenom] = {
                        name: asset.name || asset.symbol || baseDenom,
                        symbol: asset.symbol || asset.name || baseDenom,
                        display: asset.display || baseDenom,
                        denom_units: asset.denom_units || []
                    };
                });
            }
            
            return assetsMap;
        } catch (error) {
            console.error('Error loading assets info:', error);
            // Return some default mappings for common denoms
            return this.getDefaultAssetMappings(chainName);
        }
    }

    getDefaultAssetMappings(chainName) {
        const defaults = {
            'cosmoshub': {
                'uatom': {
                    name: 'Cosmos Hub',
                    symbol: 'ATOM',
                    display: 'atom',
                    denom_units: [
                        { denom: 'uatom', exponent: 0 },
                        { denom: 'atom', exponent: 6 }
                    ]
                }
            },
            'osmosis': {
                'uosmo': {
                    name: 'Osmosis',
                    symbol: 'OSMO',
                    display: 'osmo',
                    denom_units: [
                        { denom: 'uosmo', exponent: 0 },
                        { denom: 'osmo', exponent: 6 }
                    ]
                }
            }
        };
        
        return defaults[chainName] || {};
    }

    formatBalance(amount, denom, assetsInfo) {
        const assetInfo = assetsInfo[denom];
        
        if (!assetInfo) {
            return {
                name: denom,
                denom: denom,
                amount: amount
            };
        }
        
        // Find the display denom unit
        let displayAmount = amount;
        let displayDenom = assetInfo.symbol;
        
        if (assetInfo.denom_units && assetInfo.denom_units.length > 0) {
            // Find the display unit
            const displayUnit = assetInfo.denom_units.find(u => u.denom === assetInfo.display) ||
                               assetInfo.denom_units[assetInfo.denom_units.length - 1];
            
            if (displayUnit && displayUnit.exponent) {
                const divisor = Math.pow(10, displayUnit.exponent);
                displayAmount = (parseInt(amount) / divisor).toFixed(displayUnit.exponent);
                displayDenom = displayUnit.denom;
            }
        }
        
        return {
            name: assetInfo.name,
            denom: denom,
            amount: displayAmount,
            displayDenom: displayDenom
        };
    }

    displayResults(balances, blockHeight, assetsInfo) {
        const resultsSection = document.getElementById('resultsSection');
        const blockHeightDisplay = document.getElementById('blockHeightDisplay');
        const balancesDisplay = document.getElementById('balancesDisplay');
        
        // Safely set block height text content
        blockHeightDisplay.innerHTML = '';
        const blockHeightStrong = document.createElement('strong');
        blockHeightStrong.textContent = 'Block Height:';
        blockHeightDisplay.appendChild(blockHeightStrong);
        blockHeightDisplay.appendChild(document.createTextNode(' ' + this.escapeHtml(blockHeight)));
        
        if (balances.length === 0) {
            balancesDisplay.innerHTML = '';
            const noBalancesDiv = document.createElement('div');
            noBalancesDiv.className = 'no-balances';
            noBalancesDiv.textContent = 'No balances found at this block height.';
            balancesDisplay.appendChild(noBalancesDiv);
        } else {
            balancesDisplay.innerHTML = '';
            balances.forEach(balance => {
                const formatted = this.formatBalance(balance.amount, balance.denom, assetsInfo);
                const balanceItem = document.createElement('div');
                balanceItem.className = 'balance-item';
                
                // Create asset info div
                const assetInfo = document.createElement('div');
                assetInfo.className = 'asset-info';
                
                const assetName = document.createElement('div');
                assetName.className = 'asset-name';
                assetName.textContent = formatted.name;
                
                const assetDenom = document.createElement('div');
                assetDenom.className = 'asset-denom';
                assetDenom.textContent = formatted.denom;
                
                assetInfo.appendChild(assetName);
                assetInfo.appendChild(assetDenom);
                
                // Create balance amount div
                const balanceAmount = document.createElement('div');
                balanceAmount.className = 'balance-amount';
                balanceAmount.textContent = `${formatted.amount} ${formatted.displayDenom}`;
                
                balanceItem.appendChild(assetInfo);
                balanceItem.appendChild(balanceAmount);
                balancesDisplay.appendChild(balanceItem);
            });
        }
        
        resultsSection.style.display = 'block';
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showLoading() {
        document.getElementById('loadingIndicator').style.display = 'block';
    }

    hideLoading() {
        document.getElementById('loadingIndicator').style.display = 'none';
    }

    showError(message) {
        const errorSection = document.getElementById('errorSection');
        const errorMessage = document.getElementById('errorMessage');
        errorMessage.textContent = message;
        errorSection.style.display = 'block';
    }

    hideError() {
        document.getElementById('errorSection').style.display = 'none';
    }

    hideResults() {
        document.getElementById('resultsSection').style.display = 'none';
    }
}

// Initialize the application when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new CosmosWalletChecker();
});
