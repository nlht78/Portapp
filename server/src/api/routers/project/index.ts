import express from 'express';
import { ProjectController } from '../../controllers/project.controller';

const projectRouter = express.Router();

// Get complete project data (roadmap, earning mechanisms, updates)
projectRouter.get('/:tokenId', async (req, res) => {
  try {
    await ProjectController.getProjectData(req, res);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get project updates only
projectRouter.get('/:tokenId/updates', async (req, res) => {
  try {
    await ProjectController.getProjectUpdates(req, res);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get project roadmap only
projectRouter.get('/:tokenId/roadmap', async (req, res) => {
  try {
    await ProjectController.getProjectRoadmap(req, res);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get earning mechanisms only
projectRouter.get('/:tokenId/earning', async (req, res) => {
  try {
    await ProjectController.getEarningMechanisms(req, res);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default projectRouter; 