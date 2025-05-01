import { Router } from "express";
import { ResourceController } from "../../controllers/resource.controller";
import { authenticationV2 } from "@middlewares/authentication";
import { hasPermission } from "@middlewares/authorization";

const resourceRouter = Router();

// Require authentication for all resource routes
resourceRouter.use(authenticationV2);

// CRUD routes
resourceRouter.get(
  "/",
  hasPermission("resource", "read"),
  ResourceController.getResources
);
resourceRouter.post(
  "/",
  hasPermission("resource", "create"),
  ResourceController.createResource
);
resourceRouter.get(
  "/:resourceId",
  hasPermission("resource", "read"),
  ResourceController.getResourceById
);
resourceRouter.put(
  "/:resourceId",
  hasPermission("resource", "update"),
  ResourceController.updateResource
);
resourceRouter.delete(
  "/:resourceId",
  hasPermission("resource", "delete"),
  ResourceController.deleteResource
);

module.exports = resourceRouter;
