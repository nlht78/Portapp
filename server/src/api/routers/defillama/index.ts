import { Router } from 'express';
import { DeFiLlamaController } from '../../controllers/defillama.controller';

const router = Router();

// Protocol routes
router.get('/protocol/:protocolId', (req, res) => DeFiLlamaController.getProtocol(req, res));
router.get('/protocols/search', (req, res) => DeFiLlamaController.searchProtocols(req, res));
router.get('/protocol/:protocolId/treasury', (req, res) => DeFiLlamaController.getTreasury(req, res));
router.get('/protocol/:protocolId/tvl-history', (req, res) => DeFiLlamaController.getProtocolTvlHistory(req, res));
router.get('/protocol/:protocolId/funding', (req, res) => DeFiLlamaController.getFundingRounds(req, res));
router.get('/protocol/:protocolId/investors', (req, res) => DeFiLlamaController.getInvestors(req, res));
router.get('/protocol/:protocolId/comprehensive', (req, res) => DeFiLlamaController.getComprehensiveData(req, res));

// Token routes
router.get('/token/:address', (req, res) => DeFiLlamaController.getTokenData(req, res));
router.get('/token/:address/protocols', (req, res) => DeFiLlamaController.getProtocolByTokenAddress(req, res));

module.exports = router;
