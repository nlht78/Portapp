const express = require('express');
const router = express.Router();
const { AIResearchController } = require('../../controllers/ai-research.controller');

// Main AI research endpoint
router.post('/:tokenId', AIResearchController.researchToken);

// Get research history
router.get('/:tokenId/history', AIResearchController.getResearchHistory);

// Get research insights
router.get('/:tokenId/insights', AIResearchController.getResearchInsights);

module.exports = router; 