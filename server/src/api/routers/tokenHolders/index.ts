import express from 'express';
import { TokenHoldersController } from '../../controllers/tokenHolders.controller';

const router = express.Router();

// Get top token holders
router.get('/:tokenAddress/holders', TokenHoldersController.getTopTokenHolders);

// Get token info
router.get('/:tokenAddress/info', TokenHoldersController.getTokenInfo);

// Get address info
router.get('/address/:address', TokenHoldersController.getAddressInfo);

// Get supported blockchains
router.get('/blockchains', TokenHoldersController.getSupportedBlockchains);

module.exports = router; 