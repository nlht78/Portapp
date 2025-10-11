import { Router } from 'express';
import { DeFiLlamaController } from '../../controllers/defillama.controller';

const router = Router();

// Protocol routes
router.get('/protocol/:protocolId', async (req, res) => {
  try {
    await DeFiLlamaController.getProtocol(req, res);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/protocols/search', async (req, res) => {
  try {
    await DeFiLlamaController.searchProtocols(req, res);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/protocol/:protocolId/treasury', async (req, res) => {
  try {
    await DeFiLlamaController.getTreasury(req, res);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/protocol/:protocolId/tvl-history', async (req, res) => {
  try {
    await DeFiLlamaController.getProtocolTvlHistory(req, res);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/protocol/:protocolId/funding', async (req, res) => {
  try {
    await DeFiLlamaController.getFundingRounds(req, res);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/protocol/:protocolId/investors', async (req, res) => {
  try {
    await DeFiLlamaController.getInvestors(req, res);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/protocol/:protocolId/comprehensive', async (req, res) => {
  try {
    await DeFiLlamaController.getComprehensiveData(req, res);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Token routes
router.get('/token/:address', async (req, res) => {
  try {
    await DeFiLlamaController.getTokenData(req, res);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/token/:address/protocols', async (req, res) => {
  try {
    await DeFiLlamaController.getProtocolByTokenAddress(req, res);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
