import { Request, Response } from 'express';
import { ProjectService } from '../services/project.service';
import { ProjectDataResponse } from '../interfaces/project.interface';

export class ProjectController {
  static async getProjectData(req: Request, res: Response) {
    try {
      const { tokenId } = req.params;

      if (!tokenId) {
        return res.status(400).json({
          status: 400,
          message: 'Token ID is required',
          metadata: null,
        });
      }

      // First get token data from CoinGecko
      const tokenResponse = await fetch(`https://api.coingecko.com/api/v3/coins/${tokenId}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!tokenResponse.ok) {
        return res.status(404).json({
          status: 404,
          message: 'Token not found',
          metadata: null,
        });
      }

      const tokenData = await tokenResponse.json();

      // Get project data
      const projectData = await ProjectService.getProjectData(tokenId, tokenData);

      const response: ProjectDataResponse = {
        status: 200,
        message: 'Project data retrieved successfully',
        metadata: projectData,
      };

      res.json(response);
    } catch (error) {
      console.error('Error in getProjectData:', error);
      res.status(500).json({
        status: 500,
        message: 'Internal server error',
        metadata: null,
      });
    }
  }

  static async getProjectUpdates(req: Request, res: Response) {
    try {
      const { tokenId } = req.params;
      const { source, limit = '10' } = req.query;

      if (!tokenId) {
        return res.status(400).json({
          status: 400,
          message: 'Token ID is required',
          metadata: null,
        });
      }

      // Get token data first
      const tokenResponse = await fetch(`https://api.coingecko.com/api/v3/coins/${tokenId}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!tokenResponse.ok) {
        return res.status(404).json({
          status: 404,
          message: 'Token not found',
          metadata: null,
        });
      }

      const tokenData = await tokenResponse.json();
      const projectData = await ProjectService.getProjectData(tokenId, tokenData);

      // Filter updates by source if specified
      let updates = projectData.updates;
      if (source) {
        updates = updates.filter(update => update.source === source);
      }

      // Limit results
      updates = updates.slice(0, parseInt(limit as string));

      res.json({
        status: 200,
        message: 'Project updates retrieved successfully',
        metadata: {
          updates,
          total: updates.length,
          source: source || 'all',
        },
      });
    } catch (error) {
      console.error('Error in getProjectUpdates:', error);
      res.status(500).json({
        status: 500,
        message: 'Internal server error',
        metadata: null,
      });
    }
  }

  static async getProjectRoadmap(req: Request, res: Response) {
    try {
      const { tokenId } = req.params;

      if (!tokenId) {
        return res.status(400).json({
          status: 400,
          message: 'Token ID is required',
          metadata: null,
        });
      }

      // Get token data first
      const tokenResponse = await fetch(`https://api.coingecko.com/api/v3/coins/${tokenId}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!tokenResponse.ok) {
        return res.status(404).json({
          status: 404,
          message: 'Token not found',
          metadata: null,
        });
      }

      const tokenData = await tokenResponse.json();
      const projectData = await ProjectService.getProjectData(tokenId, tokenData);

      res.json({
        status: 200,
        message: 'Project roadmap retrieved successfully',
        metadata: {
          roadmap: projectData.roadmap,
          total: projectData.roadmap.length,
        },
      });
    } catch (error) {
      console.error('Error in getProjectRoadmap:', error);
      res.status(500).json({
        status: 500,
        message: 'Internal server error',
        metadata: null,
      });
    }
  }

  static async getEarningMechanisms(req: Request, res: Response) {
    try {
      const { tokenId } = req.params;

      if (!tokenId) {
        return res.status(400).json({
          status: 400,
          message: 'Token ID is required',
          metadata: null,
        });
      }

      // Get token data first
      const tokenResponse = await fetch(`https://api.coingecko.com/api/v3/coins/${tokenId}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!tokenResponse.ok) {
        return res.status(404).json({
          status: 404,
          message: 'Token not found',
          metadata: null,
        });
      }

      const tokenData = await tokenResponse.json();
      const projectData = await ProjectService.getProjectData(tokenId, tokenData);

      res.json({
        status: 200,
        message: 'Earning mechanisms retrieved successfully',
        metadata: {
          earningMechanisms: projectData.earningMechanisms,
          total: projectData.earningMechanisms.length,
        },
      });
    } catch (error) {
      console.error('Error in getEarningMechanisms:', error);
      res.status(500).json({
        status: 500,
        message: 'Internal server error',
        metadata: null,
      });
    }
  }
} 