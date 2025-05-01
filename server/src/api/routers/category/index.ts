import { CategoryController } from "@controllers/category.controller";
import { authenticationV2 } from "@middlewares/authentication";
import { hasPermission } from "@middlewares/authorization";
import { Router } from "express";

const router = Router();

router.get("/", CategoryController.getCategories);
router.get("/:id", CategoryController.getCategory);

router.use(authenticationV2);

router.post(
  "/",
  hasPermission("category", "create"),
  CategoryController.createCategory
);
router.put(
  "/:id",
  hasPermission("category", "update"),
  CategoryController.updateCategory
);
router.delete(
  "/:id",
  hasPermission("category", "delete"),
  CategoryController.deleteCategory
);

module.exports = router;
