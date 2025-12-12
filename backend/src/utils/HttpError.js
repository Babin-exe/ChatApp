class HttpError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status || 500;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export default HttpError;
