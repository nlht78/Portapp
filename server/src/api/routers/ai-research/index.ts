import express from 'express';
import { AIResearchController } from '../../controllers/ai-research.controller';

const aiResearchRouter = express.Router();

// Main AI research endpoint
aiResearchRouter.post('/:tokenId', (req, res) => AIResearchController.researchToken(req, res));

// Get research history
aiResearchRouter.get('/:tokenId/history', (req, res) => AIResearchController.getResearchHistory(req, res));

// Get research insights
aiResearchRouter.get('/:tokenId/insights', (req, res) => AIResearchController.getResearchInsights(req, res));

export default aiResearchRouter; 