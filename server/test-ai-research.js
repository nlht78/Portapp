const fetch = require('node-fetch');

async function testAIResearch() {
  try {
    console.log('🧪 Testing AI Research API...');
    
    const response = await fetch('http://localhost:8080/api/v1/ai-research', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tokenId: 'axs',
        query: 'Research AXS token roadmap and upcoming features',
        timeRange: '1m'
      })
    });

    console.log('Status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Success!');
      console.log('Data keys:', Object.keys(data));
      console.log('Summary:', data.summary?.substring(0, 100) + '...');
      console.log('Findings count:', data.findings?.length);
    } else {
      const errorText = await response.text();
      console.error('❌ Error:', errorText);
    }
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

testAIResearch(); 