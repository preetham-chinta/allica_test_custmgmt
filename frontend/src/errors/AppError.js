import { ERROR_CODES, ERROR_MESSAGES } from "@/constants/ErrorCodes";

/**
 * AppError — base error class for all application errors.
 *
 * Three message surfaces:
 *   userMessage   → safe to show in UI — from ERROR_MESSAGES constants
 *   serverMessage → raw API string — for logging only, never shown in UI
 *   message       → inherited from Error, same as userMessage
 *
 * Components only ever read error.userMessage.
 * Logging / monitoring reads all fields.
 */
export class AppError extends Error {
  constructor(code, httpStatus, serverMessage = "") {
    const userMessage = ERROR_MESSAGES[code] ?? ERROR_MESSAGES[ERROR_CODES.UNKNOWN];
    super(userMessage);

    this.name          = "AppError";
    this.code          = code;
    this.httpStatus    = httpStatus;
    this.userMessage   = userMessage;
    this.serverMessage = serverMessage;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }

  isClientError() { return this.httpStatus >= 400 && this.httpStatus < 500; }
  isServerError()  { return this.httpStatus >= 500; }
}
