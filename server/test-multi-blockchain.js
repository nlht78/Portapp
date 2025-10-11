const axios = require('axios');

async function testMultiBlockchainAPI() {
  console.log('🧪 Testing Multi-Blockchain Token Holders API...\n');

  // Test cases for different blockchains
  const testCases = [
    {
      name: 'Ethereum USDT',
      address: '0xdac17f958d2ee523a2206206994597c13d831ec7',
      blockchain: 'ethereum'
    },
    {
      name: 'BSC BUSD',
      address: '0xe9e7cea3dedca5984780bafc599bd69add087d56',
      blockchain: 'bsc'
    },
    {
      name: 'Auto-detect (Ethereum)',
      address: '0xa0b86a33e6441b8c4c8c0b8c4c8c0b8c4c8c0b8c',
      blockchain: null
    }
  ];

  for (const testCase of testCases) {
    try {
      console.log(`🔍 Testing: ${testCase.name}`);
      console.log(`   Address: ${testCase.address}`);
      console.log(`   Blockchain: ${testCase.blockchain || 'auto-detect'}`);
      
      const url = new URL(`http://localhost:8080/api/v1/token-holders/${testCase.address}/holders`);
      url.searchParams.set('limit', '5');
      if (testCase.blockchain) {
        url.searchParams.set('blockchain', testCase.blockchain);
      }

      const response = await axios.get(url.toString());
      
      console.log('✅ Response:');
      console.log(`   - Status: ${response.status}`);
      console.log(`   - Blockchain: ${response.data.metadata.blockchain}`);
      console.log(`   - Holders count: ${response.data.metadata.holders.length}`);
      console.log(`   - Total holders: ${response.data.metadata.total}`);
      
      if (response.data.metadata.holders.length > 0) {
        const firstHolder = response.data.metadata.holders[0];
        console.log(`   - Top holder: ${firstHolder.address}`);
        console.log(`   - Balance: ${firstHolder.balance}`);
        console.log(`   - Share: ${firstHolder.share}%`);
      }
      
      console.log('');

    } catch (error) {
      console.error(`❌ Test failed for ${testCase.name}:`, error.response?.data || error.message);
      console.log('');
    }
  }

  // Test supported blockchains endpoint
  try {
    console.log('🔍 Testing Supported Blockchains...');
    const response = await axios.get('http://localhost:8080/api/v1/token-holders/blockchains');
    console.log('✅ Supported Blockchains:');
    response.data.metadata.blockchains.forEach((bc) => {
      console.log(`   - ${bc.name} (${bc.id}): ${bc.explorer}`);
    });
  } catch (error) {
    console.error('❌ Failed to get supported blockchains:', error.response?.data || error.message);
  }

  console.log('\n🎉 Multi-Blockchain API Test Complete!');
}

testMultiBlockchainAPI(); 