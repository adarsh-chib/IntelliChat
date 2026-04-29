import z from "zod";

export const signupValidator = z.object({
  Name: z.string().min(3, "Full name must be at least 3 characters"),

  email: z
    .string()
    .min(1, "email is required")
    .min(6, "password should atleast 6 character"),

  password: z
    .string()
    .min(6, "password must be at least 6 characters")
    .regex(/[a-z]/, "must contain at least one lowercase letter")
    .regex(/[A-Z]/, "must contain at least one uppercase letter")
    .regex(/[0-9]/, "must contain at least one number")
    .regex(
      /[!@#$%^&*(),.?":{}|<>]/,
      "must contain at least one special character",
    ),
});
