import { z } from "zod"

// Reusable email schema
const emailSchema = z.string().email({
  message: "Please enter a valid email address.",
})

export const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
})

export const signupSchema = z
  .object({
    email: emailSchema,
    password: z.string().min(8, {
      message: "Password must be at least 8 characters.",
    }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"], // path of error
  })

export const forgotPasswordSchema = z.object({
  email: emailSchema,
}) 