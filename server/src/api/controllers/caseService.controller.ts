import { Request, Response } from 'express';
import { OK } from '../core/success.response';
import * as CaseServiceService from '../services/caseService.service';
import { NotFoundError } from '../core/errors';
import {
  ICaseServiceFilter,
  ICaseServicePagination,
} from '../interfaces/caseService.interface';

export class CaseServiceController {
  static async createCase(req: Request, res: Response) {
    const { customerId, ...caseData } = req.body;

    // Validate customerId
    if (!customerId) {
      throw new NotFoundError('Customer ID is required');
    }

    const result = await CaseServiceService.createCase({
      ...caseData,
      customerId: customerId,
      appointmentDate: new Date(caseData.appointmentDate),
    });

    return OK({
      res,
      message: 'Case service created successfully',
      metadata: result,
    });
  }

  static async getCases(req: Request, res: Response) {
    const {
      // Pagination
      page,
      limit,
      sortBy,
      sortOrder,

      // Date filters cho createdAt
      startDate,
      endDate,
      month,
      week,
      day,

      // Date filters cho appointment date
      appointmentStartDate,
      appointmentEndDate,

      // Tìm kiếm
      search,

      // Trạng thái thanh toán
      paymentStatus,

      // Other filters
      note,
      contactChannel,
      isFullyPaid,
      customerId,
    } = req.query;

    const filter: ICaseServiceFilter = {
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      month: month ? parseInt(month as string) : undefined,
      week: week ? parseInt(week as string) : undefined,
      day: day ? parseInt(day as string) : undefined,
      note: note as string,
      contactChannel: contactChannel as string,
      isFullyPaid:
        isFullyPaid === 'true'
          ? true
          : isFullyPaid === 'false'
          ? false
          : undefined,
      customerId: customerId as string,

      // Thêm các filter mới
      appointmentStartDate: appointmentStartDate
        ? new Date(appointmentStartDate as string)
        : undefined,
      appointmentEndDate: appointmentEndDate
        ? new Date(appointmentEndDate as string)
        : undefined,
      paymentStatus: paymentStatus as 'paid' | 'unpaid' | undefined,
      search: search as string,
    };

    const pagination: ICaseServicePagination = {
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 10,
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc',
    };

    const result = await CaseServiceService.getCases(filter, pagination);

    return OK({
      res,
      message: 'Cases retrieved successfully',
      metadata: result,
    });
  }

  static async getCaseById(req: Request, res: Response) {
    const caseId = req.params.id;
    const caseService = await CaseServiceService.getCaseById(caseId);
    return OK({
      res,
      message: 'Case retrieved successfully',
      metadata: caseService,
    });
  }

  static async updateCase(req: Request, res: Response) {
    const caseId = req.params.id;
    const updateData = req.body;

    const result = await CaseServiceService.updateCase(caseId, updateData);
    return OK({
      res,
      message: 'Case updated successfully',
      metadata: result,
    });
  }

  static async deleteCase(req: Request, res: Response) {
    const caseId = req.params.id;
    const result = await CaseServiceService.deleteCase(caseId);
    return OK({
      res,
      message: 'Case deleted successfully',
      metadata: result,
    });
  }

  static async deleteMultipleCases(req: Request, res: Response) {
    const caseIds = req.body.caseIds as string[];
    if (!caseIds || caseIds.length === 0) {
      return OK({
        res,
        message: 'No case IDs provided for deletion',
        metadata: { success: false },
      });
    }
    const result = await CaseServiceService.deleteMultipleCases(caseIds);
    return OK({
      res,
      message: 'Cases deleted successfully',
      metadata: result,
    });
  }

  // Additional endpoints for specific case service operations
  static async updateCaseProgress(req: Request, res: Response) {
    const caseId = req.params.id;
    const { progressNote, progressPercent } = req.body;

    const result = await CaseServiceService.updateCaseProgress(caseId, {
      case_progressNote: progressNote,
      case_progressPercent: progressPercent,
    });

    return OK({
      res,
      message: 'Case progress updated successfully',
      metadata: result,
    });
  }

  static async updateCasePayment(req: Request, res: Response) {
    const caseId = req.params.id;
    const { amountPaid, paymentMethod } = req.body;

    const result = await CaseServiceService.updateCasePayment(caseId, {
      case_amountPaid: amountPaid,
      case_paymentMethod: paymentMethod,
    });

    return OK({
      res,
      message: 'Case payment updated successfully',
      metadata: result,
    });
  }

  static async updateProcessStatus(req: Request, res: Response) {
    const caseId = req.params.id;
    const { statusField, value } = req.body;

    const result = await CaseServiceService.updateProcessStatus(
      caseId,
      statusField,
      value
    );
    return OK({
      res,
      message: 'Process status updated successfully',
      metadata: result,
    });
  }

  static async assignStaff(req: Request, res: Response) {
    const caseId = req.params.id;
    const { consultantId, fingerprintTakerId, mainCounselorId } = req.body;

    const result = await CaseServiceService.assignStaff(caseId, {
      case_consultantId: consultantId,
      case_fingerprintTakerId: fingerprintTakerId,
      case_mainCounselorId: mainCounselorId,
    });

    return OK({
      res,
      message: 'Staff assigned successfully',
      metadata: result,
    });
  }

  static async getCasesByCustomer(req: Request, res: Response) {
    const customerId = req.params.customerId;
    const cases = await CaseServiceService.getCasesByCustomer(customerId);
    return OK({
      res,
      message: 'Customer cases retrieved successfully',
      metadata: cases,
    });
  }

  // Hàm lấy tất cả case services trực tiếp từ database
  static async getAllCaseServices(req: Request, res: Response) {
    try {
      const result = await CaseServiceService.getAllCaseServices();

      return OK({
        res,
        message: 'All case services retrieved successfully',
        metadata: result,
      });
    } catch (error) {
      throw error;
    }
  }

  static async getCaseStatistics(req: Request, res: Response) {
    const { type, date, groupBy } = req.query as Record<string, string>;
    const report = await CaseServiceService.getCaseStatistics({
      type,
      date,
      groupBy,
    });
    return OK({
      res,
      message: 'Daily report retrieved successfully',
      metadata: report,
    });
  }

  static async getCaseRevenue(req: Request, res: Response) {
    const { type, date } = req.query;
    const report = await CaseServiceService.getCaseRevenue(
      type as string,
      date as string
    );
    return OK({
      res,
      message: 'Monthly revenue retrieved successfully',
      metadata: report,
    });
  }

  static async getCaseDebt(req: Request, res: Response) {
    const { type, date } = req.query;
    const report = await CaseServiceService.getCaseDebt(
      type as string,
      date as string
    );
    return OK({
      res,
      message: 'Monthly debt retrieved successfully',
      metadata: report,
    });
  }
}
