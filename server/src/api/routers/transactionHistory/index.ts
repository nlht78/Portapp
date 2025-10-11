import express from 'express';
import { TransactionHistoryController } from '../../controllers/transactionHistory.controller';

const router = express.Router();

// Get token transactions
router.get('/:tokenAddress/transactions', TransactionHistoryController.getTokenTransactions);

// Get large transactions (>100k USD)
router.get('/:tokenAddress/large-transactions', TransactionHistoryController.getLargeTransactions);

// Get transaction by hash
router.get('/transaction/:txHash', TransactionHistoryController.getTransactionByHash);

// Get supported blockchains
router.get('/blockchains', TransactionHistoryController.getSupportedBlockchains);

module.exports = router; 