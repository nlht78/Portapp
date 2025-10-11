const axios = require('axios');

async function testUSDTHistory() {
  console.log('🧪 Testing USDT Transaction History...\n');

  try {
    console.log('🔍 Testing: http://localhost:5173/token/tether/history');
    const response = await axios.get('http://localhost:5173/token/tether/history', {
      timeout: 10000,
      validateStatus: function (status) {
        return status < 500;
      }
    });

    console.log(`✅ Status: ${response.status}`);
    
    if (response.status === 200) {
      console.log('   ✅ Page loaded successfully');
      
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
      if (content.includes('Tether')) {
        console.log('   ✅ Contains "Tether" token name');
      }
      if (content.includes('USDT')) {
        console.log('   ✅ Contains "USDT" symbol');
      }
    } else {
      console.log(`   ❌ Unexpected status: ${response.status}`);
    }
    
  } catch (error) {
    console.log('❌ Error testing USDT history:');
    console.log(`   ❌ ${error.message}`);
  }

  console.log('\n🎉 USDT Transaction History Test Complete!');
}

testUSDTHistory(); 