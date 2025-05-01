import { Router } from 'express';
import { CustomerController } from '@controllers/customer.controller';
import { authenticationV2 } from '@middlewares/authentication';
import { hasPermission } from '@middlewares/authorization';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Require authentication for all routes
router.use(authenticationV2);

// Get all customers
router.get(
  '/',
  hasPermission('customer', 'read'),
  CustomerController.getCustomers
);

// Get all customers with case services
router.get(
  '/with-case-services',
  hasPermission('customer', 'read'),
  CustomerController.getCustomersWithCaseServices
);

// Create new customer
router.post(
  '/',
  hasPermission('customer', 'create'),
  CustomerController.createCustomer
);

// Import customers from CSV
router.post(
  '/import',
  hasPermission('customer', 'create'),
  upload.single('file'),
  CustomerController.importFromCSV
);

// Delete all customers
router.delete(
  '/delete-all',
  hasPermission('customer', 'delete'),
  CustomerController.deleteAllData
);

// Delete multiple customers
router.delete(
  '/delete-multiple',
  hasPermission('customer', 'delete'),
  CustomerController.deleteMultipleCustomers
);

// Get customer by ID
router.get(
  '/:id',
  hasPermission('customer', 'read'),
  CustomerController.getCustomerById
);

// Get customer with case service by ID
router.get(
  '/:id/with-case-service',
  hasPermission('customer', 'read'),
  CustomerController.getCustomerWithCaseService
);

// Update customer
router.put(
  '/:id',
  hasPermission('customer', 'update'),
  CustomerController.updateCustomer
);
// Delete customer
router.delete(
  '/:id',
  hasPermission('customer', 'delete'),
  CustomerController.deleteCustomer
);

module.exports = router;
