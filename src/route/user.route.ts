import Express from "express";
import { validate } from "../middleware/validation.middleware";
import { signupValidator } from "../validators/auth.validation";
import {
  userRegister,
  userLogin,
  userUpdate,
  userDelete,
  getUser,
} from "../controller/user.controller";

const userRouter = Express.Router();

userRouter.post("/create", validate(signupValidator), userRegister);
userRouter.post("/login", userLogin); // You might want a loginValidator here too
userRouter.get("/:id", getUser);
userRouter.put("/:id", userUpdate);
userRouter.delete("/:id", userDelete);

export default userRouter;