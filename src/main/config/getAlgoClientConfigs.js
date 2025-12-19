export function getAlgodConfigFromViteEnvironment() {
  /// For main process, we'll use default Algorand mainnet settings
  // You can modify these or use environment variables as needed
  return {
    server: process.env.VITE_ALGOD_SERVER || 'https://mainnet-api.algonode.cloud',
    port: process.env.VITE_ALGOD_PORT || 443,
    token: process.env.VITE_ALGOD_TOKEN || '',
    network: process.env.VITE_ALGOD_NETWORK || 'mainnet',
  }
}

export function getIndexerConfigFromViteEnvironment() {
  return {
    server: process.env.VITE_INDEXER_SERVER || 'https://mainnet-idx.algonode.cloud',
    port: process.env.VITE_INDEXER_PORT || 443,
    token: process.env.VITE_INDEXER_TOKEN || '',
    network: process.env.VITE_ALGOD_NETWORK || 'mainnet',
  }
}

export function getKmdConfigFromViteEnvironment() {
  return {
    server: process.env.VITE_KMD_SERVER || '',
    port: process.env.VITE_KMD_PORT || 4002,
    token: process.env.VITE_KMD_TOKEN || '',
    wallet: process.env.VITE_KMD_WALLET || '',
    password: process.env.VITE_KMD_PASSWORD || '',
  }
} 