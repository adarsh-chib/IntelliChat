import Express from "express";
import { validate } from "../middleware/validation.middleware";
import {
  signupValidator,
  signinValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
} from "../validators/auth.validation";
import {
  userRegister,
  userLogin,
  userUpdate,
  userDelete,
  getUser,
  forgotPassword,
  resetPassword,
} from "../controller/user.controller";

const userRouter = Express.Router();

userRouter.post("/create", validate(signupValidator), userRegister);
userRouter.post("/login", validate(signinValidator), userLogin);
userRouter.post(
  "/forgot-password",
  validate(forgotPasswordValidator),
  forgotPassword,
);
userRouter.post(
  "/reset-password",
  validate(resetPasswordValidator),
  resetPassword,
);
userRouter.get("/:id", getUser);
userRouter.put("/:id", userUpdate);
userRouter.delete("/:id", userDelete);

export default userRouter;
