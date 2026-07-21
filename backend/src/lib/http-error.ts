export class HttpError extends Error {
  public readonly code: string;
  public readonly statusCode: number;

  constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
  }
}

export function isHttpError(error: unknown): error is HttpError {
  return error instanceof HttpError;
}
