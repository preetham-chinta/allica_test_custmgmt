/**
 * Error codes and user-facing messages.
 *
 * ERROR_CODES  — string constants, one per error type
 * ERROR_MESSAGES — what the user sees, keyed by error code
 *
 * Components read error.userMessage — they never see HTTP status codes
 * or raw server strings. Server messages may expose internals (table names,
 * stack traces) so they stay in AppError.serverMessage for logging only.
 */

export const ERROR_CODES = {
  // Domain errors
  DUPLICATE_CUSTOMER:  "ERR_DUPLICATE_CUSTOMER",
  CUSTOMER_NOT_FOUND:  "ERR_CUSTOMER_NOT_FOUND",

  // Client errors
  VALIDATION_FAILED:   "ERR_VALIDATION_FAILED",
  UNAUTHORISED:        "ERR_UNAUTHORISED",
  FORBIDDEN:           "ERR_FORBIDDEN",

  // Transport errors
  SERVER_ERROR:        "ERR_SERVER_ERROR",
  NETWORK_ERROR:       "ERR_NETWORK_ERROR",
  REQUEST_ABORTED:     "ERR_REQUEST_ABORTED",
  REQUEST_TIMEOUT:     "ERR_REQUEST_TIMEOUT",
  UNKNOWN:             "ERR_UNKNOWN",
};

export const ERROR_MESSAGES = {
  [ERROR_CODES.DUPLICATE_CUSTOMER]: "A customer with this name and date of birth already exists.",
  [ERROR_CODES.CUSTOMER_NOT_FOUND]: "Customer not found.",
  [ERROR_CODES.VALIDATION_FAILED]:  "Please check the form for errors.",
  [ERROR_CODES.UNAUTHORISED]:       "Your session has expired. Please sign in again.",
  [ERROR_CODES.FORBIDDEN]:          "You do not have permission to perform this action.",
  [ERROR_CODES.SERVER_ERROR]:       "Something went wrong on our end. Please try again.",
  [ERROR_CODES.NETWORK_ERROR]:      "Could not connect. Please check your network.",
  [ERROR_CODES.REQUEST_ABORTED]:    "Request was cancelled.",
  [ERROR_CODES.REQUEST_TIMEOUT]:    "Request timed out. Please try again.",
  [ERROR_CODES.UNKNOWN]:            "An unexpected error occurred.",
};
