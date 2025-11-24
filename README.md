# Crypto Portfolio Management Platform

A comprehensive cryptocurrency portfolio management platform with AI-powered research capabilities, real-time price tracking, and multi-source data aggregation.

## 🚀 Features

### Core Features
- **Portfolio Management**: Track and manage your cryptocurrency investments
- **Real-time Price Data**: Multi-source price aggregation from CoinGecko, CoinPaprika, CryptoCompare, and CoinCap
- **AI Research**: Powered by MegaLLM for intelligent token analysis and insights
- **Token Search**: Fast and accurate token search across multiple data sources
- **Transaction History**: Track blockchain transactions across multiple networks
- **Token Holders**: View token holder distribution and analytics
- **Market Data**: Comprehensive market data including charts, exchanges, and social metrics

### Technical Features
- **Multi-Provider Fallback**: Automatic fallback between data providers for reliability
- **Response Caching**: Intelligent caching system for improved performance
- **Rate Limiting**: Built-in rate limiting and retry mechanisms
- **Error Handling**: Comprehensive error handling and logging
- **Type Safety**: Full TypeScript implementation
- **API Security**: API key authentication and CORS protection

## 📋 Tech Stack

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT-based authentication
- **Logging**: Winston with daily rotation
- **Process Management**: PM2
- **API Integration**: Axios for external APIs

### Frontend
- **Framework**: React with Remix
- **Styling**: TailwindCSS
- **UI Components**: Custom component library
- **Charts**: Chart.js with react-chartjs-2
- **State Management**: React Context API
- **Build Tool**: Vite

### AI Integration
- **Primary Provider**: MegaLLM (OpenAI-compatible API)
- **Fallback Providers**: OpenAI, Anthropic
- **Strategy**: Configurable provider strategy (fallback-chain, round-robin, priority-based)

## 🛠️ Installation

### Prerequisites
- Node.js 18+ 
- MongoDB 4.4+
- npm or yarn

### Backend Setup

1. Clone the repository
```bash
git clone <repository-url>
cd server
```

2. Install dependencies
```bash
npm install
```

3. Configure environment variables
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start the server
```bash
# Development
npm run dev

# Production
npm run build
npm start
```

### Frontend Setup

1. Navigate to client directory
```bash
cd client
```

2. Install dependencies
```bash
npm install
```

3. Configure environment variables
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start the development server
```bash
npm run dev
```

## 🔧 Configuration

### Environment Variables

#### Server (.env)
```bash
# Server Configuration
NODE_ENV=production
PORT=3000

# Database
MONGODB_HOST=your-mongodb-host
MONGODB_PORT=27017
MONGODB_NAME=your-database-name
MONGODB_USER=your-username
MONGODB_PWD=your-password

# API Keys
API_APIKEY=your-api-key
COINGECKO_API_KEY=your-coingecko-key

# AI Providers
MEGALLM_API_KEY=your-megallm-key
MEGALLM_ENDPOINT=https://api.megallm.com
OPENAI_API_KEY=your-openai-key

# CORS
ALLOWED_ORIGINS=https://your-frontend-domain.com

# Cache Configuration
AI_RESPONSE_CACHE_ENABLED=true
AI_RESPONSE_CACHE_TTL=3600000
```

#### Client (.env)
```bash
API_URL=https://your-backend-url.com
API_APIKEY=your-api-key
```

## 📚 API Documentation

### Authentication
All API requests require an API key in the header:
```bash
x-api-key: your-api-key
```

### Main Endpoints

#### Token Search
```bash
GET /api/v1/coingecko/search?query=bitcoin
```

#### Token Data
```bash
GET /api/v1/coingecko/token/:tokenId
```

#### Market Chart
```bash
GET /api/v1/coingecko/market-chart/:tokenId?days=7
```

#### AI Research
```bash
POST /api/v1/ai-research/token
Content-Type: application/json

{
  "tokenId": "bitcoin",
  "includeMarketData": true,
  "includeSocialData": true
}
```

#### User Tokens
```bash
GET /api/v1/user-tokens
POST /api/v1/user-tokens
PUT /api/v1/user-tokens/:id
DELETE /api/v1/user-tokens/:id
```

## 🚀 Deployment

### Production Deployment

1. **Build the application**
```bash
# Backend
cd server
npm run build

# Frontend
cd client
npm run build
```

2. **Configure production environment variables**
   - See DEPLOYMENT_GUIDE.md for detailed instructions

3. **Deploy to your hosting platform**
   - Backend: Render, Railway, or any Node.js hosting
   - Frontend: Vercel, Netlify, or any static hosting

### Docker Deployment (Optional)
```bash
# Build and run with Docker Compose
docker-compose up -d
```

## 🔒 Security

- All sensitive data is stored in environment variables
- API key authentication for all endpoints
- CORS protection with configurable origins
- Rate limiting on API endpoints
- Input validation and sanitization
- Secure password hashing with bcrypt
- JWT token-based authentication

See SECURITY.md for detailed security guidelines.

## 📊 Monitoring

### Logs
- Application logs: `server/src/logs/`
- Log rotation: Daily with 14-day retention
- Log levels: ERROR, WARN, INFO, DEBUG

### Metrics
- API response times
- Cache hit rates
- Provider fallback statistics
- Error rates by endpoint

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📝 License

This project is proprietary and confidential.

## 🆘 Support

For issues and questions:
- Check DEPLOYMENT_GUIDE.md for deployment issues
- Check SECURITY.md for security concerns
- Review API documentation above
- Contact the development team

## 🔄 Version History

### Current Version
- Multi-provider data aggregation
- AI-powered research with MegaLLM
- Response caching system
- Comprehensive error handling
- Production-ready deployment

---

Built with ❤️ for the crypto community
