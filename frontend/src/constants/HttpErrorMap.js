import { ERROR_CODES } from "./ErrorCodes";

/**
 * Maps HTTP status codes to error codes.
 *
 * Lives in constants — not in HttpClient — so it can be imported
 * independently for testing and service-level overrides.
 *
 * Services can override specific codes for their domain context.
 * For example: a 404 on /customers/{id} → CustomerNotFoundError,
 * but a 404 on /customers/reindex → a generic SERVER_ERROR.
 * The service makes that call, not HttpClient.
 */
export const HTTP_ERROR_MAP = {
  400: ERROR_CODES.VALIDATION_FAILED,
  401: ERROR_CODES.UNAUTHORISED,
  403: ERROR_CODES.FORBIDDEN,
  404: ERROR_CODES.CUSTOMER_NOT_FOUND,
  409: ERROR_CODES.DUPLICATE_CUSTOMER,
  422: ERROR_CODES.VALIDATION_FAILED,
  500: ERROR_CODES.SERVER_ERROR,
  502: ERROR_CODES.SERVER_ERROR,
  503: ERROR_CODES.SERVER_ERROR,
  504: ERROR_CODES.SERVER_ERROR,
};
