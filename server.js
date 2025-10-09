const http = require('http');
const https = require('https');
const url = require('url');

const PORT = 3000;

// REST endpoints for different chains
// These should be replaced with actual working endpoints in production
const REST_ENDPOINTS = {
    'cosmoshub': 'https://cosmos-api.polkachu.com',
    'osmosis': 'https://osmosis-api.polkachu.com',
    'akash': 'https://akash-api.polkachu.com',
    'juno': 'https://juno-api.polkachu.com',
    'stargaze': 'https://stargaze-api.polkachu.com',
    'secretnetwork': 'https://lcd-secret.scrtlabs.com',
    'celestia': 'https://celestia-rest.lavenderfive.com',
    'injective': 'https://injective-api.polkachu.com',
    'dydx': 'https://dydx-rest.lavenderfive.com',
    'neutron': 'https://neutron-rest.publicnode.com'
};

// Mock data for demonstration when APIs are unavailable
const MOCK_DATA = {
    balances: {
        'cosmos1c4k24jzduc365kywrsvf5ujz4ya6mwympnc4en': {
            'cosmoshub': [
                { denom: 'uatom', amount: '1000000' },
                { denom: 'ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2', amount: '5000000' }
            ],
            'osmosis': [
                { denom: 'uosmo', amount: '25000000' }
            ]
        },
        'osmo1vwrruj48vk8q49a7g8z08284wlvm9s6el6c7ej': {
            'osmosis': [
                { denom: 'uosmo', amount: '123456789' },
                { denom: 'ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2', amount: '50000000' }
            ]
        }
    },
    blockHeight: '23456789',
    blockInfo: {
        header: {
            height: '23456789',
            time: new Date().toISOString()
        }
    }
};

const server = http.createServer((req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    // Handle chain registry request
    if (pathname === '/api/chain-registry/chains') {
        // Return curated chain list with registry information
        const chains = [
            { chain_name: 'cosmoshub', pretty_name: 'Cosmos Hub', bech32_prefix: 'cosmos' },
            { chain_name: 'osmosis', pretty_name: 'Osmosis', bech32_prefix: 'osmo' },
            { chain_name: 'akash', pretty_name: 'Akash', bech32_prefix: 'akash' },
            { chain_name: 'juno', pretty_name: 'Juno', bech32_prefix: 'juno' },
            { chain_name: 'stargaze', pretty_name: 'Stargaze', bech32_prefix: 'stars' },
            { chain_name: 'secretnetwork', pretty_name: 'Secret Network', bech32_prefix: 'secret' },
            { chain_name: 'celestia', pretty_name: 'Celestia', bech32_prefix: 'celestia' },
            { chain_name: 'injective', pretty_name: 'Injective', bech32_prefix: 'inj' },
            { chain_name: 'dydx', pretty_name: 'dYdX', bech32_prefix: 'dydx' },
            { chain_name: 'neutron', pretty_name: 'Neutron', bech32_prefix: 'neutron' }
        ];
        
        res.writeHead(200, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify({ chains: chains }));
        return;
    }

    // Handle API proxy requests: /api/{chain}/{endpoint}
    if (pathname.startsWith('/api/')) {
        const parts = pathname.split('/').filter(p => p);
        if (parts.length < 2) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid API path' }));
            return;
        }

        const chainName = parts[1];
        const endpoint = parts.slice(2).join('/');
        const queryString = parsedUrl.search || '';

        // Validate chain name against whitelist to prevent SSRF
        // Only allow requests to pre-defined, trusted blockchain APIs
        if (!REST_ENDPOINTS.hasOwnProperty(chainName)) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Chain not found' }));
            return;
        }

        const restEndpoint = REST_ENDPOINTS[chainName];
        
        // Validate endpoint path to prevent path traversal
        if (endpoint.includes('..') || endpoint.includes('//')) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid endpoint path' }));
            return;
        }

        // This is a legitimate proxy to known blockchain APIs
        // The target URL is constructed from a whitelisted base URL and validated endpoint
        const targetUrl = `${restEndpoint}/${endpoint}${queryString}`;
        console.log(`Proxying request to: ${targetUrl}`);

        https.get(targetUrl, (proxyRes) => {
            let data = '';

            proxyRes.on('data', (chunk) => {
                data += chunk;
            });

            proxyRes.on('end', () => {
                res.writeHead(proxyRes.statusCode, {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                });
                res.end(data);
            });
        }).on('error', (err) => {
            console.error('Proxy error:', err);
            console.log('Using mock data for demonstration purposes');
            
            // Return mock data when real API is unavailable
            let mockResponse = {};
            
            if (endpoint.includes('balances/')) {
                const address = endpoint.split('/').pop();
                const chainBalances = MOCK_DATA.balances[address]?.[chainName] || [];
                mockResponse = { balances: chainBalances };
            } else if (endpoint.includes('blocks/latest')) {
                mockResponse = { block: MOCK_DATA.blockInfo };
            } else {
                mockResponse = { error: 'Mock data not available for this endpoint' };
            }
            
            res.writeHead(200, {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            });
            res.end(JSON.stringify(mockResponse));
        });

        return;
    }

    // Serve static files
    const fs = require('fs');
    const path = require('path');

    // Validate and sanitize the pathname to prevent path traversal
    const sanitizedPath = pathname.replace(/\.\./g, '').replace(/\/\//g, '/');
    
    let filePath = '.' + sanitizedPath;
    if (filePath === './' || filePath === '.') {
        filePath = './index.html';
    }

    // Ensure the resolved path stays within the current directory
    const resolvedPath = path.resolve(filePath);
    const baseDir = path.resolve('.');
    if (!resolvedPath.startsWith(baseDir)) {
        res.writeHead(403, { 'Content-Type': 'text/html' });
        res.end('<h1>403 Forbidden</h1>', 'utf-8');
        return;
    }

    const extname = String(path.extname(filePath)).toLowerCase();
    const mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon'
    };

    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(resolvedPath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 Not Found</h1>', 'utf-8');
            } else {
                res.writeHead(500);
                res.end('Server Error: ' + error.code);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
    console.log(`API proxy available at http://localhost:${PORT}/api/{chain}/{endpoint}`);
});
