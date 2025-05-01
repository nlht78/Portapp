import { Request, Response } from 'express';
import { OK } from '../core/success.response';
import * as employeeService from '../services/employee.service';

export class EmployeeController {
  static async createEmployee(req: Request, res: Response) {
    const result = await employeeService.createEmployee(req.body);
    return OK({
      res,
      message: 'Employee and user created successfully',
      metadata: result,
    });
  }

  static async getEmployees(req: Request, res: Response) {
    // Kiểm tra scope quyền hạn để quyết định cách lấy dữ liệu
    const scope = req.permissionScope || 'own'; // Default to 'own' if not specified
    
    let employees;
    if (scope === 'any') {
      // Nếu có quyền đọc bất kỳ, lấy tất cả
      employees = await employeeService.getEmployees(req.query);
    } else {
      // Nếu chỉ có quyền đọc của mình, lọc theo userId
      const query = { ...req.query, userId: req.user.userId };
      employees = await employeeService.getEmployees(query);
    }
    
    return OK({
      res,
      message: 'Employees retrieved successfully',
      metadata: employees,
    });
  }

  static async getEmployeeById(req: Request, res: Response) {
    try {
      const employeeId = req.params.id;
      const scope = req.permissionScope || 'own'; // Default to 'own' if not specified
      
      // Lấy thông tin employee
      const employee = await employeeService.getEmployeeById(employeeId);
      
      // Nếu scope là 'own', kiểm tra xem employee có thuộc về người dùng hiện tại không
      if (scope === 'own' && (!employee.userId || employee.userId.id.toString() !== req.user.userId)) {
        res.status(403).json({
          message: 'Access denied: You can only view your own information',
          metadata: null
        });
        return;
      }
      
      return OK({
        res,
        message: 'Employee retrieved successfully',
        metadata: employee,
      });
    } catch (error) {
      throw error;
    }
  }

  static async getEmployeeByUserId(req: Request, res: Response) {
    try {
      const targetUserId = req.params.userId;
      const scope = req.permissionScope || 'own';
      
      // Nếu scope là 'own', kiểm tra xem targetUserId có phải là của người dùng hiện tại không
      if (scope === 'own' && targetUserId !== req.user.userId) {
        res.status(403).json({
          message: 'Access denied: You can only view your own information',
          metadata: null
        });
        return;
      }
      
      const employee = await employeeService.getEmployeeByUserId(targetUserId);
      
      return OK({
        res,
        message: 'Employee retrieved successfully',
        metadata: employee,
      });
    } catch (error) {
      throw error;
    }
  }

  static async getCurrentEmployeeByUserId(req: Request, res: Response) {
    const employee = await employeeService.getCurrentEmployeeByUserId(
      req.user.userId
    );
    return OK({
      res,
      message: 'Employee retrieved successfully',
      metadata: employee,
    });
  }

  static async updateEmployee(req: Request, res: Response) {
    const employeeId = req.params.id;
    const scope = req.permissionScope || 'own'; // Default to 'own' if not specified
    
    try {
      // Nếu scope là 'own', cần kiểm tra xem employee có thuộc về người dùng hiện tại không
      if (scope === 'own') {
        // Lấy thông tin employee để kiểm tra
        const employee = await employeeService.getEmployeeById(employeeId);
        
        // Kiểm tra xem employee có thuộc về người dùng hiện tại không
        if (!employee.userId || employee.userId.id.toString() !== req.user.userId) {
          res.status(403).json({
            message: 'Access denied: You can only update your own information',
            metadata: null
          });
          return; // Kết thúc hàm ở đây, không làm gì thêm
        }
      }
      
      const result = await employeeService.updateEmployee(
        employeeId,
        req.body
      );
      
      return OK({
        res,
        message: 'Employee updated successfully',
        metadata: result,
      });
    } catch (error) {
      // Bắt lỗi và gọi next(error) nếu cần
      throw error;
    }
  }

  static async deleteEmployee(req: Request, res: Response) {
    try {
      const employeeId = req.params.id;
      const scope = req.permissionScope || 'own'; // Default to 'own' if not specified
      
      // Nếu scope là 'own', kiểm tra xem employee có thuộc về người dùng hiện tại không
      if (scope === 'own') {
        // Lấy thông tin employee để kiểm tra
        const employee = await employeeService.getEmployeeById(employeeId);
        
        // Kiểm tra xem employee có thuộc về người dùng hiện tại không
        if (!employee.userId || employee.userId.id.toString() !== req.user.userId) {
          res.status(403).json({
            message: 'Access denied: You can only delete your own account',
            metadata: null
          });
          return;
        }
      }
      
      const result = await employeeService.deleteEmployee(employeeId);
      
      return OK({
        res,
        message: 'Employee deleted successfully',
        metadata: result,
      });
    } catch (error) {
      throw error;
    }
  }
}
