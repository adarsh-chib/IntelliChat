import prisma from "../configs/prisma";
import { ApiError } from "../utils/api.error";
import bcrypt from "bcrypt";
import { generateAccessToken } from "../utils/generateaccesstoken";
import { generateRefreshToken } from "../utils/generaterefreshtoken";
import { accessToken, refreshTOken } from "../configs/jwt";

export const userRegisterServices = async (
  name: string,
  email: string,
  password: string,
) => {
  const findUser = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!findUser) {
    throw new ApiError(404, "user not found");
  }

  const hashpassword = await bcrypt.hash(password, 10);
  const userCreate = await prisma.user.create({
    data: {
      name: name,
      email: email,
      password: hashpassword,
    },
  });
  const { password: savedPassword, ...userWithoutPassword } = userCreate;
  return userWithoutPassword;
};

export const userLoginServices = async (email: string, password: string) => {
  const findUser = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!findUser) {
    throw new ApiError(404, "user not found");
  }

  if (!findUser.password) {
    throw new ApiError(400, "password login is not available for this user");
  }

  const passwordCompare = await bcrypt.compare(password, findUser.password);

  if (!passwordCompare) {
    throw new ApiError(402, "invalid email and password");
  }

  const payload = {
    email: email,
    password: password,
  };

  const tokenAccess = generateAccessToken(payload);
  const tokenRefresh = generateRefreshToken(payload);

  const { password: savedPassword, ...userWithoutPassword } = findUser;

  return {
    userWithoutPassword,
    tokenAccess,
    tokenRefresh,
  };
};

export const userUpdateServices = async (id: string, data: { name?: string; email?: string }) => {
  const updatedUser = await prisma.user.update({
    where: { id },
    data,
  });
  const { password, ...userWithoutPassword } = updatedUser;
  return userWithoutPassword;
};

export const userDeleteServices = async (id: string) => {
  await prisma.user.delete({
    where: { id },
  });
  return { message: "User deleted successfully" };
};

export const getUserServices = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
  });
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
};
