import { AppError }                            from "@/errors/AppError";
import { DuplicateCustomerError,
         CustomerNotFoundError }               from "@/errors/CustomerErrors";
import { ERROR_CODES, ERROR_MESSAGES }         from "@/constants/ErrorCodes";

describe("AppError", () => {
  it("sets code, httpStatus, userMessage, serverMessage", () => {
    const err = new AppError(ERROR_CODES.DUPLICATE_CUSTOMER, 409, "raw server msg");
    expect(err.code).toBe(ERROR_CODES.DUPLICATE_CUSTOMER);
    expect(err.httpStatus).toBe(409);
    expect(err.serverMessage).toBe("raw server msg");
    expect(err.userMessage).toBe(ERROR_MESSAGES[ERROR_CODES.DUPLICATE_CUSTOMER]);
  });

  it("message equals userMessage", () => {
    const err = new AppError(ERROR_CODES.SERVER_ERROR, 500);
    expect(err.message).toBe(err.userMessage);
  });

  it("isClientError true for 4xx", () => {
    expect(new AppError(ERROR_CODES.VALIDATION_FAILED, 400).isClientError).toBe(true);
    expect(new AppError(ERROR_CODES.DUPLICATE_CUSTOMER, 409).isClientError).toBe(true);
    expect(new AppError(ERROR_CODES.UNAUTHORISED,       401).isClientError).toBe(true);
  });

  it("isClientError false for 5xx", () => {
    expect(new AppError(ERROR_CODES.SERVER_ERROR, 500).isClientError).toBe(false);
    expect(new AppError(ERROR_CODES.SERVER_ERROR, 503).isClientError).toBe(false);
  });

  it("isNetworkError true when no httpStatus", () => {
    expect(new AppError(ERROR_CODES.NETWORK_ERROR, null).isNetworkError).toBe(true);
  });

  it("isNetworkError false when httpStatus present", () => {
    expect(new AppError(ERROR_CODES.SERVER_ERROR, 500).isNetworkError).toBe(false);
  });

  it("falls back to UNKNOWN message for unrecognised code", () => {
    const err = new AppError("ERR_TOTALLY_UNKNOWN", 999);
    expect(err.userMessage).toBe(ERROR_MESSAGES[ERROR_CODES.UNKNOWN]);
  });
});

describe("DuplicateCustomerError", () => {
  it("is an instance of AppError", () => {
    expect(new DuplicateCustomerError()).toBeInstanceOf(AppError);
  });

  it("has correct code and status", () => {
    const err = new DuplicateCustomerError();
    expect(err.code).toBe(ERROR_CODES.DUPLICATE_CUSTOMER);
    expect(err.httpStatus).toBe(409);
  });

  it("carries userMessage from ERROR_MESSAGES", () => {
    const err = new DuplicateCustomerError();
    expect(err.userMessage).toBe(ERROR_MESSAGES[ERROR_CODES.DUPLICATE_CUSTOMER]);
  });
});

describe("CustomerNotFoundError", () => {
  it("is an instance of AppError", () => {
    expect(new CustomerNotFoundError()).toBeInstanceOf(AppError);
  });

  it("has correct code and status", () => {
    const err = new CustomerNotFoundError();
    expect(err.code).toBe(ERROR_CODES.CUSTOMER_NOT_FOUND);
    expect(err.httpStatus).toBe(404);
  });
});
