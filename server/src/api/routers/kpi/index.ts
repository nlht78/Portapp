import { Router } from 'express';
import { KPIController } from '../../controllers/kpi.controller';
import { authenticationV2 } from '../../middlewares/authentication';
import { hasPermission } from '../../middlewares/authorization';

const router = Router();

// Require authentication for all routes
router.use(authenticationV2);

// Admin routes
// Create KPI
router.post('/', hasPermission('kpi', 'create'), KPIController.createKPI);

// Get detailed KPI's instances
router.get(
  '/instances/:instanceId',
  hasPermission('kpi-instance', 'read'),
  KPIController.getKPIInstanceById
);

// Get KPI's Instances
router.get(
  '/:kpiId/instances',
  hasPermission('kpi-instance', 'read'),
  KPIController.getKPIInstances
);

// Get detailed KPI by ID
router.get('/:id', hasPermission('kpi', 'read'), KPIController.getKPIById);

// Get all KPIs
router.get('/', hasPermission('kpi', 'read'), KPIController.getKPIs);

// Update KPI
router.put('/:id', hasPermission('kpi', 'update'), KPIController.updateKPI);

// Delete KPI
router.delete('/:id', hasPermission('kpi', 'delete'), KPIController.deleteKPI);

// Update KPI's Instance progress
router.put(
  '/instances/:instanceId',
  hasPermission('kpi-instance', 'update'),
  KPIController.updateKPIInstanceProgress
);

// Delete KPI's Instance
router.delete(
  '/instances/:instanceId',
  hasPermission('kpi-instance', 'delete'),
  KPIController.deleteKPIInstance
);

const employeeKPIRouter = Router({ mergeParams: true });
// Employee Performance Route
employeeKPIRouter.get(
  '/performance',
  hasPermission('kpi', 'read'),
  KPIController.getEmployeeKPIPerformance
);

// employee KPI's Instance Route
employeeKPIRouter.get(
  '/instances',
  hasPermission('kpi-instance', 'read'),
  KPIController.getKPIsByUserId
);

module.exports = router;
module.exports.employeeKPIRouter = employeeKPIRouter;
