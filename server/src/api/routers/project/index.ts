import express from 'express';
import { ProjectController } from '../../controllers/project.controller';

const projectRouter = express.Router();

// Get complete project data (roadmap, earning mechanisms, updates)
projectRouter.get('/:tokenId', (req, res) => ProjectController.getProjectData(req, res));

// Get project updates only
projectRouter.get('/:tokenId/updates', (req, res) => ProjectController.getProjectUpdates(req, res));

// Get project roadmap only
projectRouter.get('/:tokenId/roadmap', (req, res) => ProjectController.getProjectRoadmap(req, res));

// Get earning mechanisms only
projectRouter.get('/:tokenId/earning', (req, res) => ProjectController.getEarningMechanisms(req, res));

export default projectRouter; 