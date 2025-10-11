import { Router } from 'express';
import { DeFiLlamaController } from '../../controllers/defillama.controller';

const router = Router();

// Protocol routes
router.get('/protocol/:protocolId', DeFiLlamaController.getProtocol);
router.get('/protocols/search', DeFiLlamaController.searchProtocols);
router.get('/protocol/:protocolId/treasury', DeFiLlamaController.getTreasury);
router.get('/protocol/:protocolId/tvl-history', DeFiLlamaController.getProtocolTvlHistory);
router.get('/protocol/:protocolId/funding', DeFiLlamaController.getFundingRounds);
router.get('/protocol/:protocolId/investors', DeFiLlamaController.getInvestors);
router.get('/protocol/:protocolId/comprehensive', DeFiLlamaController.getComprehensiveData);

// Token routes
router.get('/token/:address', DeFiLlamaController.getTokenData);
router.get('/token/:address/protocols', DeFiLlamaController.getProtocolByTokenAddress);

module.exports = router;
