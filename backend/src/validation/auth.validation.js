import { z } from "zod";

export const updateProfileSchema = z.object({
  profilePic: z.string().min(1, "Profile Picture is required"),
});

export const googleAuthSchema = z.object({
  credential: z.string().min(1, "Google credential is required"),
});
