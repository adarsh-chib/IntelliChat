import z from "zod";

export const signupValidator = z.object({
  name: z.string().min(3, "Full name must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .regex(/[a-z]/, "must contain at least one lowercase letter")
    .regex(/[A-Z]/, "must contain at least one uppercase letter")
    .regex(/[0-9]/, "must contain at least one number")
    .regex(/[!@#$%^&*(),.?":{}|<>]/, "must contain at least one special character"),
});


export const signinValidator = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordValidator = z.object({
  email: z.string().email("Invalid email address"),
});

export const resetPasswordValidator = z.object({
  email: z.string().email("Invalid email address"),
  token: z.string().length(6, "Token must be exactly 6 digits"),
  newPassword: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .regex(/[a-z]/, "must contain at least one lowercase letter")
    .regex(/[A-Z]/, "must contain at least one uppercase letter")
    .regex(/[0-9]/, "must contain at least one number")
    .regex(/[!@#$%^&*(),.?":{}|<>]/, "must contain at least one special character"),
});

export const chatValidator = z.object({
  message: z.string().min(1, "Message cannot be empty"),
  chatId: z.string().optional(),
});

