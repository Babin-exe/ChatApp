import { z } from "zod";

const objectIdMessage = "Invalid id format";
const objectIdRegex = /^[a-f\d]{24}$/i;

export const sendMessageBodySchema = z.object({
  content: z.string().trim().max(1000, "Message too large").optional().default(""),
});

export const messageParamsSchema = z.object({
  messageId: z.string().regex(objectIdRegex, objectIdMessage),
});

export const reactionBodySchema = z.object({
  emoji: z.string().trim().min(1, "Reaction is required").max(16, "Reaction is too long"),
});

