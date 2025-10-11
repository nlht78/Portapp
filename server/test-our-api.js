const axios = require('axios');

async function testOurAPI() {
  try {
    console.log('Testing our CoinGecko API...');
    
    // Test trending tokens
    const trendingResponse = await axios.get('http://localhost:8080/api/v1/coingecko/trending');
    console.log('Trending tokens response:', trendingResponse.data);
    
    // Test search
    const searchResponse = await axios.get('http://localhost:8080/api/v1/coingecko/search?query=bitcoin');
    console.log('Search response:', searchResponse.data);
    
    // Test token data
    const tokenResponse = await axios.get('http://localhost:8080/api/v1/coingecko/tokens/bitcoin');
    console.log('Token data response keys:', Object.keys(tokenResponse.data.metadata));
    
  } catch (error) {
    console.error('Error testing our API:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testOurAPI(); 