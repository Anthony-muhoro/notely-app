import { Router } from "express";
import { protect } from "../middlewares/auth.middleware";
import { UserController } from "../controllers/user.controller";
import { uploadAvatar } from "../middlewares/upload.middleware";

const UserRouter = Router();
UserRouter.put("/profile", protect, UserController.updateProfileDetails);
UserRouter.put(
  "/profile/image",
  protect,
  uploadAvatar,
  UserController.changeProfileImage
);
UserRouter.put("/change-password", protect, UserController.changePassword);

export default UserRouter;
