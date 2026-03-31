import { z } from "zod";
import { MESSAGE_TYPES } from "../constants/message.constants.js";

const objectIdMessage = "Invalid id format";
const objectIdRegex = /^[a-f\d]{24}$/i;


export const receiverParamsSchema = z.object({
  receiverId: z.string().regex(objectIdRegex, objectIdMessage),
});

export const chatParamsSchema = z.object({
  chatId: z.string().regex(objectIdRegex, objectIdMessage),
});

export const messageQuerySchema = z.object({
  cursor: z.string().datetime().optional(),
  limit: z.union([z.string(), z.number()])
    .optional()
    .transform((value) => {
      if (value === undefined) return undefined;
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : value;
    })
    .pipe(z.number().int().min(1).max(100).optional()),
});

export const sendMessageSchema = z.object({
  content: z.string().trim().min(1, "Message content is required"),
  type: z.enum(MESSAGE_TYPES).optional(),
});
