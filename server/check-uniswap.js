const axios = require('axios');

async function checkUniswapData() {
  console.log('🔍 Checking Uniswap token data...\n');

  try {
    const response = await axios.get('http://localhost:8080/api/v1/coingecko/tokens/uniswap');
    
    console.log('✅ Uniswap token data:');
    console.log(`   - ID: ${response.data.metadata.id}`);
    console.log(`   - Name: ${response.data.metadata.name}`);
    console.log(`   - Symbol: ${response.data.metadata.symbol}`);
    console.log(`   - Current Price: $${response.data.metadata.currentPrice}`);
    
    if (response.data.metadata.platforms) {
      console.log('   - Platforms:');
      Object.keys(response.data.metadata.platforms).forEach(key => {
        console.log(`     ${key}: ${response.data.metadata.platforms[key]}`);
      });
    } else {
      console.log('   - Platforms: null/undefined');
    }
    
    if (response.data.metadata.detailPlatforms) {
      console.log('   - Detail Platforms:');
      Object.keys(response.data.metadata.detailPlatforms).forEach(key => {
        console.log(`     ${key}:`, response.data.metadata.detailPlatforms[key]);
      });
    } else {
      console.log('   - Detail Platforms: null/undefined');
    }

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

checkUniswapData(); 