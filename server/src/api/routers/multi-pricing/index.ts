import { Router } from 'express';
import { MultiPricingController } from '../../controllers/multi-pricing.controller';

const router = Router();

// Get token prices by IDs (batch request)
router.get('/prices', MultiPricingController.getTokenPrices);

// Get single token price
router.get('/price/:tokenId', MultiPricingController.getTokenPrice);

// Get trending tokens
router.get('/trending', MultiPricingController.getTrendingTokens);

// Search tokens
router.get('/search', MultiPricingController.searchTokens);

// Health check
router.get('/health', MultiPricingController.getPricingHealth);

module.exports = router;
