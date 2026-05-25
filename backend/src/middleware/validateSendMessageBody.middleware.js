import { sendMessageBodySchema } from "../validation/message.validation.js";
import HttpError from "../utils/HttpError.js";

export const validateSendMessageBody = (req, res, next) => {

    const result = sendMessageBodySchema.safeParse(req.body);

    if (!result.success) {
        const message = result.error.issues[0].message ?? "Invalid request payload";
        return next(new HttpError(message, 400));
    }


    const content = result.data.content;
    const hasFile = Boolean(req.file);


    if (!content && !hasFile) {
        return res(new HttpError("Message must contain text or image", 400));
    }

    req.body.content = content;

    return next();
};