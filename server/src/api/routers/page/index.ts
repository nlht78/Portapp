import { Router } from "express";

import { PageController } from "@controllers/page.controller";
import { authenticationV2 } from "@middlewares/authentication";
import { hasPermission } from "@middlewares/authorization";

const router = Router();

router.post("/:id/views", PageController.increasePageViews);

router.get("/all", hasPermission("page", "read"), PageController.getAllPages);
router.get("/:id", PageController.getPage);
router.get("/", PageController.getPublishedPages);

router.use(authenticationV2);

router.get(
  "/unpublished",
  hasPermission("page", "read"),
  PageController.getUnpublishedPages
);

router.put("/:id", hasPermission("page", "update"), PageController.updatePage);
router.post("/", hasPermission("page", "create"), PageController.createPage);
router.delete(
  "/:id",
  hasPermission("page", "delete"),
  PageController.deletePage
);

module.exports = router;
