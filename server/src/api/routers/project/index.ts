const express = require('express');
const router = express.Router();
const { ProjectController } = require('../../controllers/project.controller');

// Get complete project data (roadmap, earning mechanisms, updates)
router.get('/:tokenId', ProjectController.getProjectData);

// Get project updates only
router.get('/:tokenId/updates', ProjectController.getProjectUpdates);

// Get project roadmap only
router.get('/:tokenId/roadmap', ProjectController.getProjectRoadmap);

// Get earning mechanisms only
router.get('/:tokenId/earning', ProjectController.getEarningMechanisms);

module.exports = router; 