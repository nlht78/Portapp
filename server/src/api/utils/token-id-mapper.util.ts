/**
 * Token ID Mapper Utility
 * Maps token IDs between different formats (CoinPaprika, CoinGecko, etc.)
 */

/**
 * Map token ID to CoinGecko format
 * Handles both CoinGecko format (bitcoin) and CoinPaprika format (btc-bitcoin)
 */
export function mapToCoinGeckoId(tokenId: string): string {
  // Common mappings from CoinPaprika/other formats to CoinGecko
  const mapping: Record<string, string> = {
    'btc-bitcoin': 'bitcoin',
    'eth-ethereum': 'ethereum',
    'sol-solana': 'solana',
    'ada-cardano': 'cardano',
    'dot-polkadot': 'polkadot',
    'matic-polygon': 'polygon',
    'avax-avalanche': 'avalanche-2',
    'link-chainlink': 'chainlink',
    'uni-uniswap': 'uniswap',
    'atom-cosmos': 'cosmos',
    'xrp-xrp': 'ripple',
    'doge-dogecoin': 'dogecoin',
    'shib-shiba-inu': 'shiba-inu',
    'bnb-binance-coin': 'binancecoin',
    'usdt-tether': 'tether',
    'usdc-usd-coin': 'usd-coin',
    'ltc-litecoin': 'litecoin',
    'bch-bitcoin-cash': 'bitcoin-cash',
    'xlm-stellar': 'stellar',
    'xmr-monero': 'monero',
    'trx-tron': 'tron',
    'eos-eos': 'eos',
    'xtz-tezos': 'tezos',
    'neo-neo': 'neo',
    'vet-vechain': 'vechain',
    'miota-iota': 'iota',
    'dash-dash': 'dash',
    'zec-zcash': 'zcash',
  };

  // Check if mapping exists
  const lowerTokenId = tokenId.toLowerCase();
  if (mapping[lowerTokenId]) {
    return mapping[lowerTokenId];
  }

  // If token ID has format "xxx-name", try to extract the name part
  // e.g., "sol-solana" -> "solana"
  if (lowerTokenId.includes('-')) {
    const parts = lowerTokenId.split('-');
    if (parts.length >= 2) {
      // Return the part after first dash (usually the full name)
      return parts.slice(1).join('-');
    }
  }

  // Return as-is if no mapping found
  return lowerTokenId;
}

/**
 * Map CoinGecko ID back to CoinPaprika format
 */
export function mapToCoinPaprikaId(coinGeckoId: string): string {
  const reverseMapping: Record<string, string> = {
    'bitcoin': 'btc-bitcoin',
    'ethereum': 'eth-ethereum',
    'solana': 'sol-solana',
    'cardano': 'ada-cardano',
    'polkadot': 'dot-polkadot',
    'polygon': 'matic-polygon',
    'avalanche-2': 'avax-avalanche',
    'chainlink': 'link-chainlink',
    'uniswap': 'uni-uniswap',
    'cosmos': 'atom-cosmos',
    'ripple': 'xrp-xrp',
    'dogecoin': 'doge-dogecoin',
    'shiba-inu': 'shib-shiba-inu',
    'binancecoin': 'bnb-binance-coin',
    'tether': 'usdt-tether',
    'usd-coin': 'usdc-usd-coin',
    'litecoin': 'ltc-litecoin',
    'bitcoin-cash': 'bch-bitcoin-cash',
    'stellar': 'xlm-stellar',
    'monero': 'xmr-monero',
    'tron': 'trx-tron',
    'eos': 'eos-eos',
    'tezos': 'xtz-tezos',
    'neo': 'neo-neo',
    'vechain': 'vet-vechain',
    'iota': 'miota-iota',
    'dash': 'dash-dash',
    'zcash': 'zec-zcash',
  };

  const lowerCoinGeckoId = coinGeckoId.toLowerCase();
  return reverseMapping[lowerCoinGeckoId] || lowerCoinGeckoId;
}
