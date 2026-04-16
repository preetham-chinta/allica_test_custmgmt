import { customerService }      from "@/services/CustomerService";
import { http }                  from "@/lib/HttpClient";
import { AppError }              from "@/errors/AppError";
import { DuplicateCustomerError, CustomerNotFoundError } from "@/errors/CustomerErrors";
import { ERROR_CODES }           from "@/constants/ErrorCodes";
import { useBackendStore }        from "@/store";

// Mock HttpClient — we test CustomerService in isolation
jest.mock("@/lib/HttpClient", () => ({
  http: { get: jest.fn(), post: jest.fn() },
}));

// Mock Zustand store — CustomerService reads this via getState()
jest.mock("@/store", () => ({
  useBackendStore: {
    getState: jest.fn(() => ({ backend: "mvc", version: "v1" })),
  },
}));

describe("CustomerService", () => {
  beforeEach(() => {
    http.get.mockReset();
    http.post.mockReset();
    useBackendStore.getState.mockReturnValue({ backend: "mvc", version: "v1" });
  });

  // ── Queries ──────────────────────────────────────────────────────────────

  describe("getAll()", () => {
    it("calls http.get with correct endpoint and version", async () => {
      http.get.mockResolvedValue([{ id: 1 }]);
      await customerService.getAll();
      expect(http.get).toHaveBeenCalledWith(
        "/customers",
        expect.objectContaining({ version: "v1" })
      );
    });

    it("forwards signal to http.get", async () => {
      http.get.mockResolvedValue([]);
      const signal = new AbortController().signal;
      await customerService.getAll({ signal });
      expect(http.get).toHaveBeenCalledWith("/customers",
        expect.objectContaining({ signal })
      );
    });
  });

  describe("getById()", () => {
    it("calls http.get with customer ID in path", async () => {
      http.get.mockResolvedValue({ id: 42 });
      await customerService.getById(42);
      expect(http.get).toHaveBeenCalledWith(
        "/customers/42",
        expect.any(Object)
      );
    });

    it("maps 404 AppError → CustomerNotFoundError", async () => {
      http.get.mockRejectedValue(
        new AppError(ERROR_CODES.CUSTOMER_NOT_FOUND, 404, "Not found")
      );
      await expect(customerService.getById(99))
        .rejects.toBeInstanceOf(CustomerNotFoundError);
    });

    it("rethrows non-404 errors unchanged", async () => {
      http.get.mockRejectedValue(
        new AppError(ERROR_CODES.SERVER_ERROR, 500, "Server down")
      );
      await expect(customerService.getById(1))
        .rejects.toMatchObject({ code: ERROR_CODES.SERVER_ERROR });
    });
  });

  describe("search()", () => {
    it("uses GET for v1", async () => {
      http.get.mockResolvedValue({ results: [], totalHits: 0 });
      await customerService.search({ query: "alice", page: 0 });
      expect(http.get).toHaveBeenCalled();
      expect(http.post).not.toHaveBeenCalled();
    });

    it("uses POST for v2", async () => {
      useBackendStore.getState.mockReturnValue({ backend: "mvc", version: "v2" });
      http.post.mockResolvedValue({ results: [], totalHits: 0 });
      await customerService.search({ query: "alice", page: 0 });
      expect(http.post).toHaveBeenCalled();
      expect(http.get).not.toHaveBeenCalled();
    });
  });

  describe("suggest()", () => {
    it("always uses V2 endpoint regardless of store version", async () => {
      useBackendStore.getState.mockReturnValue({ backend: "mvc", version: "v1" });
      http.get.mockResolvedValue(["Alice", "Alicia"]);
      await customerService.suggest("ali");
      expect(http.get).toHaveBeenCalledWith(
        "/customers/suggest",
        expect.objectContaining({ version: "v2" })
      );
    });

    it("uses tighter timeout for typeahead", async () => {
      http.get.mockResolvedValue([]);
      await customerService.suggest("ali");
      expect(http.get).toHaveBeenCalledWith(
        "/customers/suggest",
        expect.objectContaining({ timeout: 3_000 })
      );
    });
  });

  // ── Commands ─────────────────────────────────────────────────────────────

  describe("create()", () => {
    const payload = { firstName: "Alice", lastName: "Smith", dateOfBirth: "1985-03-10" };

    it("calls http.post with customer data", async () => {
      http.post.mockResolvedValue({ id: 1, ...payload });
      await customerService.create(payload);
      expect(http.post).toHaveBeenCalledWith(
        "/customers",
        expect.objectContaining({ body: payload, version: "v1" })
      );
    });

    it("returns created customer", async () => {
      const created = { id: 1, ...payload, createdAt: "2026-01-01T10:00:00" };
      http.post.mockResolvedValue(created);
      await expect(customerService.create(payload)).resolves.toEqual(created);
    });

    it("maps 409 AppError → DuplicateCustomerError", async () => {
      http.post.mockRejectedValue(
        new AppError(ERROR_CODES.DUPLICATE_CUSTOMER, 409, "Customer already exists")
      );
      await expect(customerService.create(payload))
        .rejects.toBeInstanceOf(DuplicateCustomerError);
    });

    it("DuplicateCustomerError has correct userMessage", async () => {
      http.post.mockRejectedValue(
        new AppError(ERROR_CODES.DUPLICATE_CUSTOMER, 409, "raw server error")
      );
      try {
        await customerService.create(payload);
      } catch (err) {
        expect(err.userMessage).toMatch(/already exists/i);
        expect(err.serverMessage).toBe("raw server error");
      }
    });

    it("rethrows non-409 errors unchanged", async () => {
      http.post.mockRejectedValue(
        new AppError(ERROR_CODES.SERVER_ERROR, 500, "DB down")
      );
      await expect(customerService.create(payload))
        .rejects.toMatchObject({ code: ERROR_CODES.SERVER_ERROR });
    });
  });

  // ── State access ──────────────────────────────────────────────────────────

  describe("getState() pattern", () => {
    it("reads version from Zustand getState() on each call — not cached", async () => {
      http.get.mockResolvedValue([]);

      // First call — v1
      useBackendStore.getState.mockReturnValue({ backend: "mvc", version: "v1" });
      await customerService.getAll();
      expect(http.get).toHaveBeenLastCalledWith("/customers",
        expect.objectContaining({ version: "v1" })
      );

      // Switch to v2 — no re-instantiation needed
      useBackendStore.getState.mockReturnValue({ backend: "mvc", version: "v2" });
      await customerService.getAll();
      expect(http.get).toHaveBeenLastCalledWith("/customers",
        expect.objectContaining({ version: "v2" })
      );
    });
  });
});
