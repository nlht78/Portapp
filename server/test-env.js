require('dotenv').config();

console.log('🔍 Environment Variables Test:');
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY);
console.log('- ANTHROPIC_API_KEY exists:', !!process.env.ANTHROPIC_API_KEY);
console.log('- OPENAI_API_KEY length:', process.env.OPENAI_API_KEY?.length);
console.log('- ANTHROPIC_API_KEY length:', process.env.ANTHROPIC_API_KEY?.length);
console.log('- OPENAI_API_KEY starts with:', process.env.OPENAI_API_KEY?.substring(0, 10));
console.log('- ANTHROPIC_API_KEY starts with:', process.env.ANTHROPIC_API_KEY?.substring(0, 10)); 