import express from 'express';

import { checkApiKey, checkPermission } from '../auth/checkApiKey';
import { pushLog2Discord } from '../middlewares/logger.middleware';
import CheckController from '@controllers/check.controller';
import { AuthController } from '@controllers/auth.controller';

const router = express.Router();

router.use(pushLog2Discord);
//check api key

router.get('/check-status', CheckController.checkStatus);

router.get('/auth/verify-email', AuthController.verifyEmailToken);

// Public routes (no API key required)
router.use('/coingecko', require('./coingecko'));
router.use('/multi-pricing', require('./multi-pricing'));
router.use('/token-holders', require('./tokenHolders'));
router.use('/transaction-history', require('./transactionHistory'));
router.use('/project', require('./project'));
router.use('/ai-research', require('./ai-research'));
router.use('/defillama', require('./defillama'));

router.use(checkApiKey);
//check api key's permission
router.use(checkPermission('0000'));

router.use('/images', require('./image'));
router.use('/email', require('./email'));
router.use('/users', require('./user'));
router.use('/pages', require('./page'));
router.use('/auth', require('./auth'));
router.use('/app', require('./app'));
router.use('/resources', require('./resource'));
router.use('/user-tokens', require('./userToken'));
module.exports = router;
