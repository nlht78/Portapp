import { Router } from "express";
import { RoleController } from "../../controllers/role.controller";
import { authenticationV2 } from "@middlewares/authentication";
import { hasPermission } from "@middlewares/authorization";

const roleRouter = Router();

// Require authentication for all role routes
roleRouter.use(authenticationV2);

// CRUD routes
roleRouter.get("/", hasPermission("role", "read"), RoleController.getRoles);
roleRouter.post(
  "/",
  hasPermission("role", "create"),
  RoleController.createRole
);
roleRouter.get(
  "/:roleId",
  hasPermission("role", "read"),
  RoleController.getRoleById
);
roleRouter.put(
  "/:roleId",
  hasPermission("role", "update"),
  RoleController.updateRole
);
roleRouter.delete(
  "/:roleId",
  hasPermission("role", "delete"),
  RoleController.deleteRole
);

// Grant management
roleRouter.put(
  "/:roleId/grants",
  hasPermission("role", "update"),
  RoleController.updateRoleGrants
);

roleRouter.post(
  "/:roleId/grants",
  hasPermission("role", "create"),
  RoleController.addRoleGrants
);
roleRouter.delete(
  "/:roleId/grants/:resourceId",
  hasPermission("role", "delete"),
  RoleController.deleteRoleGrant
);
module.exports = roleRouter;