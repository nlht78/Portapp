import { Router } from 'express';
import { CoinGeckoController } from '../../controllers/coingecko.controller';

const router = Router();

// Get token data by ID
router.get('/tokens/:tokenId', CoinGeckoController.getTokenData);

// Get market chart data
router.get('/tokens/:tokenId/chart', CoinGeckoController.getMarketChart);

// Search tokens
router.get('/search', CoinGeckoController.searchTokens);

// Get trending tokens
router.get('/trending', CoinGeckoController.getTrendingTokens);

// Get token prices by IDs
router.get('/price', CoinGeckoController.getTokenPrices);

module.exports = router; 