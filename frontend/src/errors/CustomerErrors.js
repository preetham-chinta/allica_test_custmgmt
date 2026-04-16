import { AppError }     from "./AppError";
import { ERROR_CODES }  from "@/constants/ErrorCodes";

/**
 * Domain errors — thin wrappers over AppError.
 *
 * Why separate classes instead of checking error.code:
 *
 *   // Checking code string — works but fragile
 *   if (error.code === "ERR_DUPLICATE_CUSTOMER") { ... }
 *
 *   // Catching by type — explicit, refactor-safe
 *   if (error instanceof DuplicateCustomerError) { ... }
 *
 * Hooks and components catch these by type.
 * No HTTP status codes appear above the service layer.
 */

export class DuplicateCustomerError extends AppError {
  constructor(serverMessage) {
    super(ERROR_CODES.DUPLICATE_CUSTOMER, 409, serverMessage);
    this.name = "DuplicateCustomerError";
  }
}

export class CustomerNotFoundError extends AppError {
  constructor(serverMessage) {
    super(ERROR_CODES.CUSTOMER_NOT_FOUND, 404, serverMessage);
    this.name = "CustomerNotFoundError";
  }
}
