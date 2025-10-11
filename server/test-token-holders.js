const axios = require('axios');

async function testTokenHoldersAPI() {
  console.log('🧪 Testing Token Holders API...\n');

  // Test với USDT token address
  const tokenAddress = '0xdac17f958d2ee523a2206206994597c13d831ec7'; // USDT
  const limit = 10;

  try {
    console.log(`1️⃣ Testing getTopTokenHolders for ${tokenAddress}...`);
    const response = await axios.get(`http://localhost:8080/api/v1/token-holders/${tokenAddress}/holders?limit=${limit}`);
    
    console.log('✅ API Response:');
    console.log(`   - Status: ${response.status}`);
    console.log(`   - Holders count: ${response.data.metadata.holders.length}`);
    console.log(`   - Total holders: ${response.data.metadata.total}`);
    
    if (response.data.metadata.holders.length > 0) {
      const firstHolder = response.data.metadata.holders[0];
      console.log(`   - Top holder: ${firstHolder.address}`);
      console.log(`   - Balance: ${firstHolder.balance}`);
      console.log(`   - Share: ${firstHolder.share}%`);
    }

    console.log('\n2️⃣ Testing getTokenInfo...');
    const tokenInfoResponse = await axios.get(`http://localhost:8080/api/v1/token-holders/${tokenAddress}/info`);
    console.log('✅ Token Info Response:');
    console.log(`   - Status: ${tokenInfoResponse.status}`);
    console.log(`   - Token name: ${tokenInfoResponse.data.metadata.name || 'N/A'}`);
    console.log(`   - Token symbol: ${tokenInfoResponse.data.metadata.symbol || 'N/A'}`);

    console.log('\n🎉 Token Holders API Test Complete!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testTokenHoldersAPI(); 