import { Request, Response } from 'express';
import { OK } from '../core/success.response';
import * as kpiService from '../services/kpi.service';
import { BadRequestError } from '../core/errors';

export class KPIController {
  // Create new KPI
  static async createKPI(req: Request, res: Response) {
    const result = await kpiService.createKPI(req.body);
    return OK({
      res,
      message: 'KPI created successfully',
      metadata: result,
    });
  }

  // Get all KPIs
  static async getKPIs(req: Request, res: Response) {
    const { assigneeId, isActive } = req.query;
    const query: any = {};

    if (assigneeId) query.assigneeId = assigneeId;
    if (isActive !== undefined) query.isActive = isActive;

    const kpis = await kpiService.getKPIs(query);
    return OK({
      res,
      message: 'KPIs retrieved successfully',
      metadata: kpis,
    });
  }

  // Get KPI by ID
  static async getKPIById(req: Request, res: Response) {
    const { id } = req.params;
    const kpi = await kpiService.getKPIById(id);
    return OK({
      res,
      message: 'KPI retrieved successfully',
      metadata: kpi,
    });
  }

  // Get KPI Instance by ID
  static async getKPIInstanceById(req: Request, res: Response) {
    const { instanceId } = req.params;
    const instance = await kpiService.getKPIInstanceById(instanceId);
    return OK({
      res,
      message: 'KPI instance retrieved successfully',
      metadata: instance,
    });
  }

  // Update KPI
  static async updateKPI(req: Request, res: Response) {
    const { id } = req.params;
    const kpi = await kpiService.updateKPI(id, req.body);
    return OK({
      res,
      message: 'KPI updated successfully',
      metadata: kpi,
    });
  }

  // New method for admin to update all fields of a KPI
  static async updateKPIFull(req: Request, res: Response) {
    const { id } = req.params;
    const kpi = await kpiService.updateKPIFull(id, req.body);
    return OK({
      res,
      message: 'KPI updated successfully (admin)',
      metadata: kpi,
    });
  }

  // Delete KPI
  static async deleteKPI(req: Request, res: Response) {
    const { id } = req.params;
    const result = await kpiService.deleteKPI(id);
    return OK({
      res,
      message: 'KPI deleted successfully',
      metadata: result,
    });
  }

  // Get KPI Instances
  static async getKPIInstances(req: Request, res: Response) {
    const { kpiId } = req.params;
    const instances = await kpiService.getKPIInstances(kpiId);
    return OK({
      res,
      message: 'KPI instances retrieved successfully',
      metadata: instances,
    });
  }

  // Update KPI Instance Progress
  static async updateKPIInstanceProgress(req: Request, res: Response) {
    const { instanceId } = req.params;
    const { completed } = req.body;

    if (typeof completed !== 'number') {
      throw new BadRequestError('Completed must be a number');
    }

    const instance = await kpiService.updateKPIInstanceProgress(
      instanceId,
      completed
    );
    return OK({
      res,
      message: 'KPI instance progress updated successfully',
      metadata: instance,
    });
  }

  // New method for admin to update all fields of a KPI instance
  static async updateKPIInstance(req: Request, res: Response) {
    const { instanceId } = req.params;
    const instance = await kpiService.updateKPIInstance(instanceId, req.body);
    return OK({
      res,
      message: 'KPI instance updated successfully (admin)',
      metadata: instance,
    });
  }

  // Get Employee KPI Performance
  static async getEmployeeKPIPerformance(req: Request, res: Response) {
    const { userId } = req.params;
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date();
    const end = endDate ? new Date(endDate as string) : new Date();

    const performance = await kpiService.getEmployeeKPIPerformance(
      userId,
      start,
      end
    );

    return OK({
      res,
      message: 'Employee KPI performance retrieved successfully',
      metadata: performance,
    });
  }

  // Get all KPIs with their latest instances
  static async getKPIsWithInstances(req: Request, res: Response) {
    const { assigneeId, isActive } = req.query;
    const query: any = {};

    if (assigneeId) query.assigneeId = assigneeId;
    if (isActive !== undefined) query.isActive = isActive;

    const kpis = await kpiService.getKPIsWithInstances(query);
    return OK({
      res,
      message: 'KPIs with instances retrieved successfully',
      metadata: kpis,
    });
  }

  // Get KPIs by user ID
  static async getKPIsByUserId(req: Request, res: Response) {
    const kpis = await kpiService.getKPIInstancesByUserId(
      req.params.userId,
      req.query
    );

    return OK({
      res,
      message: 'KPIs retrieved successfully',
      metadata: kpis,
    });
  }

  static async getTodayKPIInstances(req: Request, res: Response) {
    const { userId } = req.params;
    const instances = await kpiService.getTodayKPIInstances(userId);
    return OK({
      res,
      message: 'Today KPI instances retrieved successfully',
      metadata: instances,
    });
  }

  static async deleteKPIInstance(req: Request, res: Response) {
    const { instanceId } = req.params;
    const result = await kpiService.deleteKPIInstance(instanceId);
    return OK({
      res,
      message: 'KPI instance deleted successfully',
      metadata: result,
    });
  }
}
