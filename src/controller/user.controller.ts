import { Request, Response, NextFunction } from "express";
import { ApiResponse } from "../utils/api.response";
import {
  userRegisterServices,
  userLoginServices,
  userUpdateServices,
  userDeleteServices,
  getUserServices,
  forgotPasswordService,
  resetPasswordService,
} from "../service/user.service";


export const userRegister = async (req: Request, res: Response, next: NextFunction) => {
  const { name, email, password } = req.body;
  try {
    const data = await userRegisterServices(name, email, password);
    res.status(201).json(new ApiResponse(201, "User created successfully", data));
  } catch (err) {
    next(err);
  }
};

export const userLogin = async (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;
  try {
    const data = await userLoginServices(email, password);
    res.status(200).json(new ApiResponse(200, "Login successful", data));
  } catch (err) {
    next(err);
  }
};

export const userUpdate = async (req: Request, res: Response, next: NextFunction) => {
  const id = req.params.id as string;
  const { name, email } = req.body;
  try {
    const data = await userUpdateServices(id, { name, email });
    res.status(200).json(new ApiResponse(200, "User updated successfully", data));
  } catch (err) {
    next(err);
  }
};

export const userDelete = async (req: Request, res: Response, next: NextFunction) => {
  const id = req.params.id as string;
  try {
    const data = await userDeleteServices(id);
    res.status(200).json(new ApiResponse(200, "User deleted successfully", data));
  } catch (err) {
    next(err);
  }
};

export const getUser = async (req: Request, res: Response, next: NextFunction) => {
  const id = req.params.id as string;
  try {
    const data = await getUserServices(id);
    res.status(200).json(new ApiResponse(200, "User fetched successfully", data));
  } catch (err) {
    next(err);
  }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  const { email } = req.body;
  try {
    const data = await forgotPasswordService(email);
    res.status(200).json(new ApiResponse(200, "Reset token generated", data));
  } catch (err) {
    next(err);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  const { email, token, newPassword } = req.body;
  try {
    const data = await resetPasswordService(email, token, newPassword);
    res.status(200).json(new ApiResponse(200, "Password reset successfully", data));
  } catch (err) {
    next(err);
  }
};

