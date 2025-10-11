const axios = require('axios');

async function testCoinGeckoAPI() {
  try {
    console.log('Testing CoinGecko API...');
    
    // Test trending tokens
    const trendingResponse = await axios.get('https://api.coingecko.com/api/v3/search/trending');
    console.log('Trending tokens response:', trendingResponse.data);
    
    // Test search
    const searchResponse = await axios.get('https://api.coingecko.com/api/v3/search?query=bitcoin');
    console.log('Search response:', searchResponse.data);
    
    // Test token data
    const tokenResponse = await axios.get('https://api.coingecko.com/api/v3/coins/bitcoin');
    console.log('Token data response keys:', Object.keys(tokenResponse.data));
    
  } catch (error) {
    console.error('Error testing CoinGecko API:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testCoinGeckoAPI(); 