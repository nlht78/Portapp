import { Router } from 'express';
import { CaseServiceController } from '@controllers/caseService.controller';
import { authenticationV2 } from '@middlewares/authentication';
import { hasPermission } from '@middlewares/authorization';

const router = Router();

// Require authentication for all routes
router.use(authenticationV2);

// Base CRUD routes
router.post(
  '/',
  hasPermission('case-service', 'create'),
  CaseServiceController.createCase
);

router.delete(
  '/multiple',
  hasPermission('case-service', 'delete'),
  CaseServiceController.deleteMultipleCases
);

router.delete(
  '/:id',
  hasPermission('case-service', 'delete'),
  CaseServiceController.deleteCase
);

// Additional business logic routes
router.patch(
  '/:id/progress',
  hasPermission('case-service', 'update'),
  CaseServiceController.updateCaseProgress
);

router.put(
  '/:id',
  hasPermission('case-service', 'update'),
  CaseServiceController.updateCase
);

router.patch(
  '/:id/payment',
  hasPermission('case-service', 'update'),
  CaseServiceController.updateCasePayment
);

router.patch(
  '/:id/process-status',
  hasPermission('case-service', 'update'),
  CaseServiceController.updateProcessStatus
);

router.patch(
  '/:id/assign-staff',
  hasPermission('case-service', 'update'),
  CaseServiceController.assignStaff
);

// Customer-specific routes
router.get(
  '/customer/:customerId',
  hasPermission('case-service', 'read'),
  CaseServiceController.getCasesByCustomer
);

// New route to get all case services without filtering
router.get(
  '/all/direct',
  hasPermission('case-service', 'read'),
  CaseServiceController.getAllCaseServices
);

// get case statistics report over a period of time
router.get(
  '/report',
  hasPermission('case-service', 'read'),
  CaseServiceController.getCaseStatistics
);

// get hourly reports over a period of time
// router.get(
//   '/report/hourly',
//   hasPermission('case-service', 'read'),
//   CaseServiceController.getHourlyReport
// );

// get revenue over a period of time
router.get(
  '/report/revenue',
  hasPermission('case-service', 'read'),
  CaseServiceController.getCaseRevenue
);

// get debt over a period of time
router.get(
  '/report/debt',
  hasPermission('case-service', 'read'),
  CaseServiceController.getCaseDebt
);

router.get(
  '/:id',
  hasPermission('case-service', 'read'),
  CaseServiceController.getCaseById
);

router.get(
  '/',
  hasPermission('case-service', 'read'),
  CaseServiceController.getCases
);

module.exports = router;
