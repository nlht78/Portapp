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
export const hasPermission = (resource: string, action: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;

      // Lấy thông tin user và populate roles
      const user = (await getUserById(userId)) as any as IUserDetail;

      let hasAnyPermission = false;
      let hasOwnPermission = false;

      for (const grant of user.usr_role.grants) {
        // Kiểm tra resource và action
        if (grant.resourceId.slug === resource) {
          if (grant.actions.includes(`${action}.any`)) {
            hasAnyPermission = true;
          }
          if (grant.actions.includes(`${action}.own`)) {
            hasOwnPermission = true;
          }
        }
      }

      // Nếu có quyền, cho phép tiếp tục
      if (hasAnyPermission || hasOwnPermission) {
        // Thêm thông tin scope vào request để controller có thể sử dụng
        req.permissionScope = hasAnyPermission ? 'any' : 'own';
        return next();
      }

      // Nếu không có quyền phù hợp, trả về lỗi
      throw new ForbiddenError('Access denied');
    } catch (error) {
      next(error);
    }
  };
};
