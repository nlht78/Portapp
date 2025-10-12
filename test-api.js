// Test script để kiểm tra API endpoints
const https = require('https');

// Thay đổi URL này thành URL Render của bạn
const API_URL = 'https://your-render-app.onrender.com';
const API_KEY = 'your_api_key_here'; // Thay đổi thành API key thực tế

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

async function testEndpoints() {
  console.log('🧪 Testing API Endpoints...\n');
  
  try {
    // Test 1: Health check
    console.log('1️⃣ Testing health check...');
    const health = await makeRequest('/check-status');
    console.log(`   Status: ${health.status}`);
    console.log(`   Response:`, health.data);
    console.log('');

    // Test 2: Search tokens
    console.log('2️⃣ Testing token search...');
    const search = await makeRequest('/coingecko/search?query=bitcoin');
    console.log(`   Status: ${search.status}`);
    if (search.status === 200) {
      console.log(`   Found ${search.data.tokens?.length || 0} tokens`);
    } else {
      console.log(`   Error:`, search.data);
    }
    console.log('');

    // Test 3: Trending tokens
    console.log('3️⃣ Testing trending tokens...');
    const trending = await makeRequest('/coingecko/trending');
    console.log(`   Status: ${trending.status}`);
    if (trending.status === 200) {
      console.log(`   Found ${trending.data.tokens?.length || 0} trending tokens`);
    } else {
      console.log(`   Error:`, trending.data);
    }
    console.log('');

    // Test 4: Token data
    console.log('4️⃣ Testing token data...');
    const tokenData = await makeRequest('/coingecko/tokens/bitcoin');
    console.log(`   Status: ${tokenData.status}`);
    if (tokenData.status === 200) {
      console.log(`   Token: ${tokenData.data.name} (${tokenData.data.symbol})`);
      console.log(`   Price: $${tokenData.data.currentPrice}`);
    } else {
      console.log(`   Error:`, tokenData.data);
    }
    console.log('');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Chạy tests
testEndpoints();

