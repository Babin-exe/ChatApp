import { z } from "zod";

export const signupSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  email: z.string().trim().email("Please provide a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const loginSchema = z.object({
  email: z.string().trim().email("Please provide a valid email"),
  password: z.string().min(1, "Password is required"),
});

export const updateProfileSchema = z.object({
  profilePic: z.string().min(1, "Profile Picture is required"),
});

