import express from 'express';
import { AIResearchController } from '../../controllers/ai-research.controller';

const aiResearchRouter = express.Router();

// Health check endpoint - must be before :tokenId routes
aiResearchRouter.get('/health', async (req, res) => {
  try {
    await AIResearchController.getHealth(req, res);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Main AI research endpoint
aiResearchRouter.post('/:tokenId', async (req, res) => {
  try {
    await AIResearchController.researchToken(req, res);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get research history
aiResearchRouter.get('/:tokenId/history', async (req, res) => {
  try {
    await AIResearchController.getResearchHistory(req, res);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get research insights
aiResearchRouter.get('/:tokenId/insights', async (req, res) => {
  try {
    await AIResearchController.getResearchInsights(req, res);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default aiResearchRouter; 