import { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '../core/errors';
import { getUserById } from '@services/user.service';
import { IUserDetail } from '../interfaces/user.interface';

// Mở rộng interface Request để thêm thuộc tính permissionScope
declare global {
  namespace Express {
    interface Request {
      permissionScope?: 'any' | 'own';
    }
  }
}

/**
 * Middleware kiểm tra quyền truy cập
 * @param resource - Tên resource (ví dụ: 'users', 'employees', etc.)
 * @param action - Hành động ('create', 'read', 'update', 'delete')
 */
// Authorization middleware disabled - role system removed
export const hasPermission = (resource: string, action: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Allow all requests since role system is removed
    return next();
  };
};
