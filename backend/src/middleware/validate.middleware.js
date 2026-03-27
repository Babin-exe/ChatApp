import HttpError from "../utils/HttpError.js";

export const validate = (schema, target = "body") => (req, _res, next) => {
  const result = schema.safeParse(req[target]);

  if (!result.success) {
    const message =
      result.error.issues?.[0]?.message || "Invalid request payload";
    return next(new HttpError(message, 400));
  }

  try {
    req[target] = result.data;
  } catch {
    Object.defineProperty(req, target, {
      value: result.data,
      writable: true,
      configurable: true,
    });
  }

  return next();
};