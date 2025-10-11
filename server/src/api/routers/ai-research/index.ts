import express from 'express';
import { AIResearchController } from '../../controllers/ai-research.controller';

const aiResearchRouter = express.Router();

// Main AI research endpoint
aiResearchRouter.post('/:tokenId', AIResearchController.researchToken);

// Get research history
aiResearchRouter.get('/:tokenId/history', AIResearchController.getResearchHistory);

// Get research insights
aiResearchRouter.get('/:tokenId/insights', AIResearchController.getResearchInsights);

export default aiResearchRouter; 