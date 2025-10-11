import express from 'express';
import { ProjectController } from '../../controllers/project.controller';

const projectRouter = express.Router();

// Get complete project data (roadmap, earning mechanisms, updates)
projectRouter.get('/:tokenId', ProjectController.getProjectData);

// Get project updates only
projectRouter.get('/:tokenId/updates', ProjectController.getProjectUpdates);

// Get project roadmap only
projectRouter.get('/:tokenId/roadmap', ProjectController.getProjectRoadmap);

// Get earning mechanisms only
projectRouter.get('/:tokenId/earning', ProjectController.getEarningMechanisms);

export default projectRouter; 