const axios = require('axios');

async function testPaginationAPI() {
  console.log('🧪 Testing Token Holders Pagination API...\n');

  const testAddress = '0xdac17f958d2ee523a2206206994597c13d831ec7'; // USDT
  const testBlockchain = 'ethereum';

  try {
    // Test page 1
    console.log('🔍 Testing Page 1...');
    const response1 = await axios.get(`http://localhost:8080/api/v1/token-holders/${testAddress}/holders`, {
      params: {
        blockchain: testBlockchain,
        limit: 30,
        page: 1
      }
    });

    console.log('✅ Page 1 Response:');
    console.log(`   - Status: ${response1.status}`);
    console.log(`   - Holders count: ${response1.data.metadata.holders.length}`);
    console.log(`   - Total holders: ${response1.data.metadata.total}`);
    console.log(`   - Current page: ${response1.data.metadata.pagination.page}`);
    console.log(`   - Total pages: ${response1.data.metadata.pagination.totalPages}`);
    console.log(`   - Has next: ${response1.data.metadata.pagination.hasNext}`);
    console.log(`   - Has prev: ${response1.data.metadata.pagination.hasPrev}`);

    if (response1.data.metadata.holders.length > 0) {
      const firstHolder = response1.data.metadata.holders[0];
      console.log(`   - First holder rank: ${firstHolder.rank}`);
      console.log(`   - First holder address: ${firstHolder.address}`);
    }

    console.log('');

    // Test page 2 if available
    if (response1.data.metadata.pagination.hasNext) {
      console.log('🔍 Testing Page 2...');
      const response2 = await axios.get(`http://localhost:8080/api/v1/token-holders/${testAddress}/holders`, {
        params: {
          blockchain: testBlockchain,
          limit: 30,
          page: 2
        }
      });

      console.log('✅ Page 2 Response:');
      console.log(`   - Status: ${response2.status}`);
      console.log(`   - Holders count: ${response2.data.metadata.holders.length}`);
      console.log(`   - Current page: ${response2.data.metadata.pagination.page}`);
      console.log(`   - Has next: ${response2.data.metadata.pagination.hasNext}`);
      console.log(`   - Has prev: ${response2.data.metadata.pagination.hasPrev}`);

      if (response2.data.metadata.holders.length > 0) {
        const firstHolder = response2.data.metadata.holders[0];
        console.log(`   - First holder rank: ${firstHolder.rank}`);
        console.log(`   - First holder address: ${firstHolder.address}`);
      }

      console.log('');
    }

    // Test different limits
    console.log('🔍 Testing different limits...');
    const limits = [10, 20, 50];
    
    for (const limit of limits) {
      try {
        const response = await axios.get(`http://localhost:8080/api/v1/token-holders/${testAddress}/holders`, {
          params: {
            blockchain: testBlockchain,
            limit: limit,
            page: 1
          }
        });

        console.log(`✅ Limit ${limit}:`);
        console.log(`   - Holders count: ${response.data.metadata.holders.length}`);
        console.log(`   - Total pages: ${response.data.metadata.pagination.totalPages}`);
        console.log(`   - Page size: ${response.data.metadata.pagination.limit}`);
      } catch (error) {
        console.error(`❌ Limit ${limit} failed:`, error.response?.data || error.message);
      }
    }

    console.log('');

    // Test invalid page
    console.log('🔍 Testing invalid page...');
    try {
      await axios.get(`http://localhost:8080/api/v1/token-holders/${testAddress}/holders`, {
        params: {
          blockchain: testBlockchain,
          limit: 30,
          page: 0
        }
      });
    } catch (error) {
      console.log('✅ Invalid page correctly rejected:');
      console.log(`   - Status: ${error.response?.status}`);
      console.log(`   - Message: ${error.response?.data?.errors?.message}`);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }

  console.log('\n🎉 Pagination API Test Complete!');
}

testPaginationAPI(); 