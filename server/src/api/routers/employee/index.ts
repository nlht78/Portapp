import { Router } from 'express';
import { EmployeeController } from '@controllers/employee.controller';
import { authenticationV2 } from '@middlewares/authentication';
import { hasPermission } from '@middlewares/authorization';

const router = Router();

// Tất cả routes đều yêu cầu xác thực
router.use(authenticationV2);

// Route để tạo nhân viên mới kèm user
router.post(
  '/',
  hasPermission('employee', 'create'),
  EmployeeController.createEmployee
);

// Employee KPI route
router.use('/:userId/kpi', require('../kpi').employeeKPIRouter);

// Route để lấy thông tin một nhân viên
router.get(
  '/:id',
  hasPermission('employee', 'read'),
  EmployeeController.getEmployeeById
);

router.get(
  '/user/me',
  hasPermission('employee', 'read'),
  EmployeeController.getCurrentEmployeeByUserId
);

// Route để lấy thông tin một nhân viên
router.get(
  '/user/:userId',
  hasPermission('employee', 'read'),
  EmployeeController.getEmployeeByUserId
);

// Route để cập nhật thông tin nhân viên
router.put(
  '/:id',
  hasPermission('employee', 'update'),
  EmployeeController.updateEmployee
);

// Route để xóa nhân viên
router.delete(
  '/:id',
  hasPermission('employee', 'delete'),
  EmployeeController.deleteEmployee
);

// Route để lấy danh sách nhân viên
router.get(
  '/',
  hasPermission('employee', 'read'),
  EmployeeController.getEmployees
);

module.exports = router;
