import { Router } from "express";
import { UserController } from "../../controllers/user.controller";
import { authenticationV2 } from "@middlewares/authentication";
import { AuthController } from "../../controllers/auth.controller";
import { hasPermission } from "../../middlewares/authorization";

const userRouter = Router();

// Require authentication routers
userRouter.use(authenticationV2);

userRouter.get("/me", UserController.getCurrentUser);

userRouter.post(
  "/change-password",
  hasPermission("user", "update"),
  UserController.changePassword
);
userRouter.put(
  "/:userId",
  hasPermission("user", "update"),
  UserController.updateUser
);
userRouter.get("/",
  hasPermission("user", "read"),
  UserController.getUsers);

module.exports = userRouter;
