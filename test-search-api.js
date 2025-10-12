// Test script để kiểm tra search API
const https = require('https');

// Thay đổi URL này thành URL Render của bạn
const API_URL = 'https://portapp-t6ms.onrender.com';
const API_KEY = 'your-api-key-here'; // Thay đổi thành API key thực tế

const headers = {
  'x-api-key': API_KEY,
  'Content-Type': 'application/json'
};

function makeRequest(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${API_URL}/api/v1${path}`);
    
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method: method,
      headers: headers
    };

    console.log('🚀 Making request:', {
      method,
      url: url.toString(),
      hasApiKey: !!API_KEY
    });

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonData
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    
    req.end();
  });
}

async function testSearchAPI() {
  console.log('🧪 Testing Search API...\n');
  
  try {
    // Test 1: Search tokens
    console.log('1️⃣ Testing search tokens...');
    const search = await makeRequest('/coingecko/search?query=bitcoin');
    console.log(`   Status: ${search.status}`);
    if (search.status === 200) {
      console.log(`   Response structure:`, {
        hasSuccess: 'success' in search.data,
        hasMessage: 'message' in search.data,
        hasMetadata: 'metadata' in search.data,
        metadataKeys: search.data.metadata ? Object.keys(search.data.metadata) : 'none',
        tokensCount: search.data.metadata?.tokens?.length || 0
      });
      console.log(`   First token:`, search.data.metadata?.tokens?.[0]);
    } else {
      console.log(`   Error:`, search.data);
    }
    console.log('');

    // Test 2: Trending tokens
    console.log('2️⃣ Testing trending tokens...');
    const trending = await makeRequest('/coingecko/trending');
    console.log(`   Status: ${trending.status}`);
    if (trending.status === 200) {
      console.log(`   Response structure:`, {
        hasSuccess: 'success' in trending.data,
        hasMessage: 'message' in trending.data,
        hasMetadata: 'metadata' in trending.data,
        metadataKeys: trending.data.metadata ? Object.keys(trending.data.metadata) : 'none',
        tokensCount: trending.data.metadata?.tokens?.length || 0
      });
    } else {
      console.log(`   Error:`, trending.data);
    }
    console.log('');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Chạy tests
testSearchAPI();
