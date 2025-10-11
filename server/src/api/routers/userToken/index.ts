import { Router } from 'express';
import { UserTokenController } from '../../controllers/userToken.controller';
import { authenticationV2 } from '../../middlewares/authentication';

const router = Router();

// Require authentication for all routes
router.use(authenticationV2);


// User token routes
// Create user token
router.post('/', UserTokenController.createUserToken);

// Get all user tokens for current user
router.get('/', UserTokenController.getUserTokens);

// Get user tokens with statistics
router.get('/with-stats', UserTokenController.getUserTokensWithStats);

// Get user token statistics
router.get('/statistics', UserTokenController.getUserTokenStatistics);

// Check if token exists for user
router.get('/check/:tokenId', UserTokenController.checkTokenExists);

// Get user token by ID
router.get('/:id', UserTokenController.getUserTokenById);

// Update user token
router.put('/:id', UserTokenController.updateUserToken);

// Delete user token
router.delete('/:id', UserTokenController.deleteUserToken);

// Update current prices for tokens (admin only)
router.put('/prices/update', UserTokenController.updateCurrentPrices);

module.exports = router; 