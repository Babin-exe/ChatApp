import { z } from "zod";


export const sendMessageBodySchema = z.object({
    content: z
        .string()
        .trim()
        .max(1000, "Message too large")
        .optional()
        .default("")
});

