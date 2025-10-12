// Test script để kiểm tra API user-tokens
const https = require('https');

// Thay đổi các giá trị này
const API_URL = 'http://localhost:8080';
const API_KEY = 'your-api-key-here'; // Thay đổi thành API key thực tế
const USER_ID = 'your-user-id'; // Thay đổi thành user ID thực tế
const ACCESS_TOKEN = 'your-access-token'; // Thay đổi thành access token thực tế

const headers = {
  'x-api-key': API_KEY,
  'x-client-id': USER_ID,
  'Authorization': `Bearer ${ACCESS_TOKEN}`,
  'Content-Type': 'application/json'
};

function makeRequest(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${API_URL}/api/v1${path}`);
    
    const options = {
      hostname: url.hostname,
      port: url.port || 3000,
      path: url.pathname + url.search,
      method: method,
      headers: headers
    };

    console.log('🚀 Making request:', {
      method,
      url: url.toString(),
      headers: {
        'x-api-key': API_KEY ? 'SET' : 'NOT SET',
        'x-client-id': USER_ID ? 'SET' : 'NOT SET',
        'Authorization': ACCESS_TOKEN ? 'SET' : 'NOT SET'
      }
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

async function testUserTokenAPI() {
  console.log('🧪 Testing User Token API...\n');
  
  try {
    // Test 1: Health check
    console.log('1️⃣ Testing health check...');
    const health = await makeRequest('/check-status');
    console.log(`   Status: ${health.status}`);
    console.log(`   Response:`, health.data);
    console.log('');

    // Test 2: Get user tokens
    console.log('2️⃣ Testing get user tokens...');
    const tokens = await makeRequest('/user-tokens');
    console.log(`   Status: ${tokens.status}`);
    if (tokens.status === 200) {
      console.log(`   Found ${tokens.data.metadata?.length || 0} tokens`);
      console.log(`   Tokens:`, tokens.data.metadata);
    } else {
      console.log(`   Error:`, tokens.data);
    }
    console.log('');

    // Test 3: Get user tokens with stats
    console.log('3️⃣ Testing get user tokens with stats...');
    const tokensWithStats = await makeRequest('/user-tokens/with-stats');
    console.log(`   Status: ${tokensWithStats.status}`);
    if (tokensWithStats.status === 200) {
      console.log(`   Found ${tokensWithStats.data.metadata?.tokens?.length || 0} tokens with stats`);
      console.log(`   Data:`, tokensWithStats.data.metadata);
    } else {
      console.log(`   Error:`, tokensWithStats.data);
    }
    console.log('');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Chạy tests
testUserTokenAPI();
