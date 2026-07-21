import { z } from "zod";

export const updateProfileSchema = z.object({
  profilePic: z.string().min(1, "Profile Picture is required"),
});

export const googleAuthSchema = z.object({
  credential: z.string().min(1, "Google credential is required"),
});

export const updateNameSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name cannot exceed 50 characters"),
});

export const updateBioSchema = z.object({
  bio: z
    .string()
    .trim()
    .min(2, "Bio must be at least 2 characters")
    .max(100, "Bio cannot exceed 100 characters"),
});
