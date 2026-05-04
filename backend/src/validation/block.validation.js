import z from "zod";

const objectIdRegex = /^[a-f\d]{24}$/i;
const objectIdMessage = "Invalid id format";


const blockUserSchema = z.object({
    blockedId: z.string().regex(objectIdRegex, objectIdMessage)
});

const unblockUserSchema = z.object({
    blockedId: z.string().regex(objectIdRegex, objectIdMessage)
});



export { blockUserSchema, unblockUserSchema };