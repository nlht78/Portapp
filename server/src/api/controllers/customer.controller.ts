import { Request, Response } from 'express';
import { OK } from '../core/success.response';
import * as CustomerService from '../services/customer.service';
import { NotFoundError, BadRequestError } from '../core/errors';
import { parse } from 'csv-parse/sync';
import {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  deleteMultipleCustomers,
  getCustomersWithCaseServices,
  getCustomerWithCaseServiceById,
} from '@services/customer.service';
import { CaseServiceModel } from '../models/caseService.model';

export class CustomerController {
  static async createCustomer(req: Request, res: Response) {
    // Tạo khách hàng mà không có thông tin case service
    const result = await createCustomer(req.body);
    return OK({
      res,
      message: 'Customer created successfully',
      metadata: result,
    });
  }

  static async getCustomerWithCaseService(req: Request, res: Response) {
    const customerId = req.params.id;
    const result = await getCustomerWithCaseServiceById(customerId);

    return OK({
      res,
      message: 'Customer with case service retrieved successfully',
      metadata: result,
    });
  }

  static async getCustomers(req: Request, res: Response) {
    // Get query params for filtering
    const {
      status,
      search,
      contactChannel,
      page = 1,
      limit = 10,
      birthMonth,
      birthDay,
      note,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    // Create query object
    const query: any = {};

    // Filter by status if provided
    if (status) {
      query.cus_status = status;
    }

    // Filter by contact channel if provided
    if (contactChannel) {
      query.cus_contactChannel = contactChannel;
    }

    // Filter by birth month if provided
    if (birthMonth) {
      query.$expr = {
        $eq: [{ $month: '$cus_dateOfBirth' }, parseInt(birthMonth as string)],
      };
    }

    // Filter by birth day if provided
    if (birthDay) {
      query.$expr = {
        $eq: [
          { $dayOfMonth: '$cus_dateOfBirth' },
          parseInt(birthDay as string),
        ],
      };
    }

    // Filter by note if provided
    if (note) {
      query.cus_note = { $regex: note, $options: 'i' };
    }

    // Filter by search term if provided
    if (search) {
      query.$or = [
        { cus_fullName: { $regex: search, $options: 'i' } },
        { cus_email: { $regex: search, $options: 'i' } },
        { cus_phone: { $regex: search, $options: 'i' } },
        { cus_contactAccountName: { $regex: search, $options: 'i' } },
        { cus_parentName: { $regex: search, $options: 'i' } },
      ];
    }

    // Create sort object
    const sort: any = {};
    sort[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

    const result = await getCustomers(query, {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      sort,
    });

    return OK({
      res,
      message: 'Customers retrieved successfully',
      metadata: result,
    });
  }

  static async getCustomerById(req: Request, res: Response) {
    const customerId = req.params.id;
    const customer = await getCustomerById(customerId);
    return OK({
      res,
      message: 'Customer retrieved successfully',
      metadata: customer,
    });
  }

  static async updateCustomer(req: Request, res: Response) {
    const customerId = req.params.id;
    const result = await updateCustomer(customerId, req.body);
    return OK({
      res,
      message: 'Customer updated successfully',
      metadata: result,
    });
  }

  static async deleteCustomer(req: Request, res: Response) {
    const customerId = req.params.id;
    const result = await deleteCustomer(customerId);
    return OK({
      res,
      message: 'Customer deleted successfully',
      metadata: result,
    });
  }

  static async deleteMultipleCustomers(req: Request, res: Response) {
    const { customerIds } = req.body;

    if (
      !customerIds ||
      !Array.isArray(customerIds) ||
      customerIds.length === 0
    ) {
      throw new BadRequestError('Customer IDs array is required');
    }

    const result = await deleteMultipleCustomers(customerIds);
    return OK({
      res,
      message: 'Customers deleted successfully',
      metadata: result,
    });
  }

  static async importFromCSV(req: Request, res: Response) {
    try {
      if (!req.file) {
        throw new BadRequestError('No file uploaded');
      }

      // Kiểm tra loại file
      const fileExtension = req.file.originalname
        .split('.')
        .pop()
        ?.toLowerCase();

      let result;

      if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        // Nếu là file Excel, sử dụng hàm import Excel
        result = await CustomerService.importCustomersFromExcel(
          req.file.buffer
        );
      } else if (fileExtension === 'csv') {
        // Nếu là file CSV, sử dụng hàm import tuần tự
        const csvContent = req.file.buffer.toString('utf-8');
        const rows = parse(csvContent, {
          skip_empty_lines: true,
          trim: true,
        });

        // Sử dụng phương pháp import từng record một thay vì bulk
        result = await CustomerService.importCustomersOneByOne(rows);
      } else {
        throw new BadRequestError(
          'Unsupported file format. Please upload CSV, XLS, or XLSX file.'
        );
      }

      // Get the actual count from the database
      const actualCaseServiceCount = await CaseServiceModel.countDocuments();

      // Update the result with the actual count
      const updatedResult = {
        ...result,
        caseServices: actualCaseServiceCount,
      };

      return OK({
        res,
        message: 'Import completed',
        metadata: updatedResult,
      });
    } catch (error) {
      throw error;
    }
  }

  static async deleteAllData(req: Request, res: Response) {
    try {
      const result = await CustomerService.deleteAllImportedData();
      return OK({
        res,
        message: 'All data deleted successfully',
        metadata: result,
      });
    } catch (error) {
      throw error;
    }
  }

  static async getCustomersWithCaseServices(req: Request, res: Response) {
    // Get query params for filtering
    const {
      status,
      search,
      contactChannel,
      page = 1,
      limit = 10,
      birthMonth,
      birthDay,
      note,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      paymentStatus,
      startDate,
      endDate,
    } = req.query;

    // Create query object
    const query: any = {};
    const caseServiceQuery: any = {};

    // Filter by status if provided
    if (status) {
      query.cus_status = status;
    }

    // Filter by contact channel if provided
    if (contactChannel) {
      query.cus_contactChannel = contactChannel;
    }

    // Filter by birth month if provided
    if (birthMonth) {
      query.$expr = {
        $eq: [{ $month: '$cus_dateOfBirth' }, parseInt(birthMonth as string)],
      };
    }

    // Filter by birth day if provided
    if (birthDay) {
      query.$expr = {
        $eq: [
          { $dayOfMonth: '$cus_dateOfBirth' },
          parseInt(birthDay as string),
        ],
      };
    }

    // Filter by note if provided
    if (note) {
      query.cus_note = { $regex: note, $options: 'i' };
    }

    // Filter by search term if provided
    if (search) {
      query.$or = [
        { cus_fullName: { $regex: search, $options: 'i' } },
        { cus_email: { $regex: search, $options: 'i' } },
        { cus_phone: { $regex: search, $options: 'i' } },
        { cus_contactAccountName: { $regex: search, $options: 'i' } },
        { cus_parentName: { $regex: search, $options: 'i' } },
      ];
    }

    // Filter by payment status if provided
    if (paymentStatus !== undefined) {
      if (paymentStatus === 'paid') {
        caseServiceQuery.case_debt = 0;
      } else if (paymentStatus === 'unpaid') {
        caseServiceQuery.case_debt = { $gt: 0 };
      }
    }

    // Filter by appointment date range if provided
    if (startDate || endDate) {
      caseServiceQuery.case_appointmentDate = {};

      if (startDate) {
        caseServiceQuery.case_appointmentDate.$gte = new Date(
          startDate as string
        );
      }

      if (endDate) {
        // Add 1 day to include the end date fully (until 23:59:59)
        const endDateObj = new Date(endDate as string);
        endDateObj.setDate(endDateObj.getDate() + 1);
        caseServiceQuery.case_appointmentDate.$lt = endDateObj;
      }
    }

    // Create sort object
    const sort: any = {};
    sort[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

    const result = await getCustomersWithCaseServices(
      query,
      {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        sort,
      },
      caseServiceQuery
    );

    return OK({
      res,
      message: 'Customers with case services retrieved successfully',
      metadata: result,
    });
  }
}
