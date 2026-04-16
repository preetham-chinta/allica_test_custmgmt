import { ERROR_CODES, ERROR_MESSAGES } from "@/constants/ErrorCodes";

describe("ErrorCodes", () => {
  it("every ERROR_CODE has a corresponding ERROR_MESSAGE", () => {
    Object.values(ERROR_CODES).forEach(code => {
      expect(ERROR_MESSAGES[code]).toBeDefined();
      expect(typeof ERROR_MESSAGES[code]).toBe("string");
      expect(ERROR_MESSAGES[code].length).toBeGreaterThan(0);
    });
  });

  it("error codes are unique strings", () => {
    const values = Object.values(ERROR_CODES);
    const unique  = new Set(values);
    expect(unique.size).toBe(values.length);
  });

  it("error codes follow ERR_ naming convention", () => {
    Object.values(ERROR_CODES).forEach(code => {
      expect(code).toMatch(/^ERR_[A-Z_]+$/);
    });
  });

  it("error messages do not expose technical details", () => {
    Object.values(ERROR_MESSAGES).forEach(msg => {
      expect(msg).not.toMatch(/http|fetch|status|stack|exception/i);
    });
  });
});
