import HttpError from "../utils/HttpError.js";

const unsafeMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export const securityHeaders = (_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  if (process.env.NODE_ENV === "production") {
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=15552000; includeSubDomains"
    );
  }

  next();
};

export const csrfOriginGuard = (req, _res, next) => {
  if (!unsafeMethods.has(req.method)) return next();

  const allowedOrigin = process.env.FRONTEND_URL;
  if (!allowedOrigin) return next();

  const origin = req.headers.origin;
  const fetchSite = req.headers["sec-fetch-site"];

  if (origin && origin !== allowedOrigin) {
    return next(new HttpError("Invalid request origin", 403));
  }

  if (
    !origin &&
    fetchSite &&
    !["same-origin", "same-site", "none"].includes(fetchSite)
  ) {
    return next(new HttpError("Invalid request origin", 403));
  }

  return next();
};
