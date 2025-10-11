const axios = require('axios');

async function testTransactionHistoryAPI() {
  console.log('🧪 Testing Transaction History API...\n');

  // Test with USDT token (has many large transactions)
  const testAddress = '0xdac17f958d2ee523a2206206994597c13d831ec7'; // USDT
  const testBlockchain = 'ethereum';

  try {
    // Test large transactions
    console.log('🔍 Testing Large Transactions...');
    const response1 = await axios.get(`http://localhost:8080/api/v1/transaction-history/${testAddress}/large-transactions`, {
      params: {
        blockchain: testBlockchain,
        limit: 10,
        page: 1,
        minValueUsd: 100000
      }
    });

    console.log('✅ Large Transactions Response:');
    console.log(`   - Status: ${response1.status}`);
    console.log(`   - Transactions count: ${response1.data.metadata.transactions.length}`);
    console.log(`   - Total: ${response1.data.metadata.total}`);
    console.log(`   - Blockchain: ${response1.data.metadata.blockchain}`);
    
    if (response1.data.metadata.pagination) {
      console.log(`   - Current page: ${response1.data.metadata.pagination.page}`);
      console.log(`   - Total pages: ${response1.data.metadata.pagination.totalPages}`);
      console.log(`   - Has next: ${response1.data.metadata.pagination.hasNext}`);
    }

    if (response1.data.metadata.transactions.length > 0) {
      const firstTx = response1.data.metadata.transactions[0];
      console.log(`   - First transaction:`);
      console.log(`     Hash: ${firstTx.hash}`);
      console.log(`     From: ${firstTx.from}`);
      console.log(`     To: ${firstTx.to}`);
      console.log(`     Value: ${firstTx.value} USDT`);
      console.log(`     Value USD: $${firstTx.valueUsd.toLocaleString()}`);
      console.log(`     Status: ${firstTx.status}`);
      console.log(`     Time: ${new Date(firstTx.timestamp).toLocaleString()}`);
    }

    console.log('');

    // Test regular transactions with filters
    console.log('🔍 Testing Regular Transactions with Filters...');
    const response2 = await axios.get(`http://localhost:8080/api/v1/transaction-history/${testAddress}/transactions`, {
      params: {
        blockchain: testBlockchain,
        limit: 5,
        page: 1,
        minValueUsd: 50000,
        status: 'success'
      }
    });

    console.log('✅ Filtered Transactions Response:');
    console.log(`   - Status: ${response2.status}`);
    console.log(`   - Transactions count: ${response2.data.metadata.transactions.length}`);
    console.log(`   - Total: ${response2.data.metadata.total}`);

    console.log('');

    // Test supported blockchains
    console.log('🔍 Testing Supported Blockchains...');
    const response3 = await axios.get('http://localhost:8080/api/v1/transaction-history/blockchains');
    console.log('✅ Supported Blockchains:');
    response3.data.metadata.blockchains.forEach((bc) => {
      console.log(`   - ${bc.name} (${bc.id}): ${bc.explorer}`);
    });

    console.log('');

    // Test transaction by hash (if we have one)
    if (response1.data.metadata.transactions.length > 0) {
      const txHash = response1.data.metadata.transactions[0].hash;
      console.log(`🔍 Testing Transaction by Hash: ${txHash}...`);
      
      try {
        const response4 = await axios.get(`http://localhost:8080/api/v1/transaction-history/transaction/${txHash}`, {
          params: {
            blockchain: testBlockchain
          }
        });

        console.log('✅ Transaction by Hash Response:');
        console.log(`   - Status: ${response4.status}`);
        console.log(`   - Hash: ${response4.data.metadata.hash}`);
        console.log(`   - From: ${response4.data.metadata.from}`);
        console.log(`   - To: ${response4.data.metadata.to}`);
        console.log(`   - Value: ${response4.data.metadata.value}`);
      } catch (error) {
        console.log('❌ Transaction by Hash failed:', error.response?.data || error.message);
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }

  console.log('\n🎉 Transaction History API Test Complete!');
}

testTransactionHistoryAPI(); 