// Quick test script để kiểm tra user tokens
const https = require('https');

// Thay đổi các giá trị này
const API_URL = 'http://localhost:8080';
const API_KEY = 'your-api-key-here'; // Thay đổi thành API key thực tế
const USER_ID = 'your-user-id'; // Thay đổi thành user ID thực tế
const ACCESS_TOKEN = 'your-access-token'; // Thay đổi thành access token thực tế

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${API_URL}/api/v1${path}`);
    
    const options = {
      hostname: url.hostname,
      port: url.port || 3000,
      path: url.pathname + url.search,
      method: 'GET',
      headers: {
        'x-api-key': API_KEY,
        'x-client-id': USER_ID,
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    };

    console.log('🚀 Making request to:', url.toString());

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
            data: jsonData
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: data
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });
    
    req.end();
  });
}

async function testUserTokens() {
  console.log('🧪 Testing User Tokens API...\n');
  
  try {
    // Test 1: Get user tokens
    console.log('1️⃣ Testing get user tokens...');
    const tokens = await makeRequest('/user-tokens');
    console.log(`   Status: ${tokens.status}`);
    console.log(`   Response:`, JSON.stringify(tokens.data, null, 2));
    console.log('');

    // Test 2: Get user tokens with stats
    console.log('2️⃣ Testing get user tokens with stats...');
    const tokensWithStats = await makeRequest('/user-tokens/with-stats');
    console.log(`   Status: ${tokensWithStats.status}`);
    console.log(`   Response:`, JSON.stringify(tokensWithStats.data, null, 2));
    console.log('');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Chạy test
testUserTokens();
