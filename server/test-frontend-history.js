const axios = require('axios');

async function testFrontendHistory() {
  console.log('🧪 Testing Frontend Transaction History...\n');

  const testUrls = [
    'http://localhost:5173/token/ethereum/history',
    'http://localhost:5173/token/bitcoin/history',
    'http://localhost:5173/token/uniswap/history'
  ];

  for (const url of testUrls) {
    try {
      console.log(`🔍 Testing: ${url}`);
      const response = await axios.get(url, {
        timeout: 10000,
        validateStatus: function (status) {
          return status < 500; // Accept all status codes less than 500
        }
      });

      console.log(`✅ Status: ${response.status}`);
      
      if (response.status === 200) {
        console.log('   ✅ Page loaded successfully');
        
        // Check if page contains expected content
        const content = response.data;
        if (content.includes('Transaction History')) {
          console.log('   ✅ Contains "Transaction History"');
        }
        if (content.includes('Large Transactions')) {
          console.log('   ✅ Contains "Large Transactions"');
        }
        if (content.includes('&gt;$100k USD')) {
          console.log('   ✅ Contains transaction filter text');
        }
      } else if (response.status === 404) {
        console.log('   ⚠️  Page not found (404)');
      } else {
        console.log(`   ❌ Unexpected status: ${response.status}`);
      }
      
    } catch (error) {
      console.log(`❌ Error testing ${url}:`);
      if (error.code === 'ECONNREFUSED') {
        console.log('   ❌ Connection refused - Client not running');
      } else if (error.code === 'ENOTFOUND') {
        console.log('   ❌ Host not found');
      } else {
        console.log(`   ❌ ${error.message}`);
      }
    }
    
    console.log('');
  }

  console.log('🎉 Frontend Transaction History Test Complete!');
}

testFrontendHistory(); 