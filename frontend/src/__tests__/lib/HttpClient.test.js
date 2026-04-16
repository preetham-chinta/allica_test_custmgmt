import { HttpClient }   from "@/lib/HttpClient";
import { AppError }     from "@/errors/AppError";
import { ERROR_CODES }  from "@/constants/ErrorCodes";
import { API_VERSIONS } from "@/constants/ApiEndpoints";
import { useAuthStore }  from "@/store";

global.fetch = jest.fn();

// Mock Zustand store — getState() used by HttpClient for auth token
jest.mock("@/store", () => ({
  useAuthStore: { getState: jest.fn(() => ({ token: null })) },
}));

function mockOk(body)        { return { ok: true,  status: 200, statusText: "OK",  json: () => Promise.resolve(body) }; }
function mockErr(status, body) { return { ok: false, status, statusText: String(status), json: () => Promise.resolve(body) }; }

describe("HttpClient", () => {
  let http;
  beforeEach(() => {
    http = new HttpClient({ baseURL: "/api" });
    fetch.mockReset();
    useAuthStore.getState.mockReturnValue({ token: null });
  });

  // ── URL construction ────────────────────────────────────────────────────
  describe("URL construction", () => {
    it("includes version segment", async () => {
      fetch.mockResolvedValue(mockOk([]));
      await http.get("/customers", { version: API_VERSIONS.V1 });
      expect(fetch.mock.calls[0][0]).toBe("/api/v1/customers");
    });

    it("omits version when not provided", async () => {
      fetch.mockResolvedValue(mockOk([]));
      await http.get("/customers");
      expect(fetch.mock.calls[0][0]).toBe("/api/customers");
    });

    it("appends query params, filters nulls", async () => {
      fetch.mockResolvedValue(mockOk([]));
      await http.get("/customers/search", {
        version: API_VERSIONS.V1,
        params: { query: "alice", page: 0, size: 12, empty: "", nullVal: null },
      });
      const url = fetch.mock.calls[0][0];
      expect(url).toContain("query=alice");
      expect(url).toContain("page=0");
      expect(url).not.toContain("empty");
      expect(url).not.toContain("nullVal");
    });
  });

  // ── Auth header ──────────────────────────────────────────────────────────
  describe("auth header", () => {
    it("attaches Authorization header when token present", async () => {
      useAuthStore.getState.mockReturnValue({ token: "test-jwt" });
      fetch.mockResolvedValue(mockOk([]));
      await http.get("/customers", { version: API_VERSIONS.V1 });
      const headers = fetch.mock.calls[0][1].headers;
      expect(headers["Authorization"]).toBe("Bearer test-jwt");
    });

    it("omits Authorization header when no token", async () => {
      useAuthStore.getState.mockReturnValue({ token: null });
      fetch.mockResolvedValue(mockOk([]));
      await http.get("/customers", { version: API_VERSIONS.V1 });
      const headers = fetch.mock.calls[0][1].headers;
      expect(headers["Authorization"]).toBeUndefined();
    });
  });

  // ── Success ──────────────────────────────────────────────────────────────
  describe("successful responses", () => {
    it("returns JSON on 200", async () => {
      fetch.mockResolvedValue(mockOk([{ id: 1 }]));
      await expect(http.get("/customers", { version: API_VERSIONS.V1 }))
        .resolves.toEqual([{ id: 1 }]);
    });

    it("returns null on 204", async () => {
      fetch.mockResolvedValue({ ok: true, status: 204, json: () => Promise.resolve(null) });
      await expect(http.post("/reindex", { version: API_VERSIONS.V1 })).resolves.toBeNull();
    });

    it("serialises body to JSON on POST", async () => {
      fetch.mockResolvedValue(mockOk({ id: 1 }));
      const body = { firstName: "Alice" };
      await http.post("/customers", { version: API_VERSIONS.V1, body });
      expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual(body);
    });
  });

  // ── Error mapping ────────────────────────────────────────────────────────
  describe("error mapping", () => {
    it("maps 409 → DUPLICATE_CUSTOMER", async () => {
      fetch.mockResolvedValue(mockErr(409, { message: "Already exists" }));
      await expect(http.post("/customers", { body: {} }))
        .rejects.toMatchObject({ code: ERROR_CODES.DUPLICATE_CUSTOMER, httpStatus: 409 });
    });

    it("maps 404 → CUSTOMER_NOT_FOUND", async () => {
      fetch.mockResolvedValue(mockErr(404, {}));
      await expect(http.get("/customers/99"))
        .rejects.toMatchObject({ code: ERROR_CODES.CUSTOMER_NOT_FOUND });
    });

    it("maps 500 → SERVER_ERROR", async () => {
      fetch.mockResolvedValue(mockErr(500, {}));
      await expect(http.get("/customers"))
        .rejects.toMatchObject({ code: ERROR_CODES.SERVER_ERROR });
    });

    it("serverMessage kept separate from userMessage", async () => {
      fetch.mockResolvedValue(mockErr(409, { message: "DB constraint violated" }));
      await expect(http.post("/customers", { body: {} }))
        .rejects.toMatchObject({
          userMessage:   expect.stringMatching(/already exists/i),
          serverMessage: "DB constraint violated",
        });
    });

    it("maps network failure → NETWORK_ERROR", async () => {
      fetch.mockRejectedValue(new TypeError("Failed to fetch"));
      await expect(http.get("/customers"))
        .rejects.toMatchObject({ code: ERROR_CODES.NETWORK_ERROR });
    });

    it("thrown error is instanceof AppError", async () => {
      fetch.mockResolvedValue(mockErr(500, {}));
      await expect(http.get("/customers")).rejects.toBeInstanceOf(AppError);
    });
  });

  // ── Timeout ──────────────────────────────────────────────────────────────
  describe("timeout", () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    it("throws REQUEST_TIMEOUT after timeoutMs", async () => {
      fetch.mockImplementation(() => new Promise(() => {}));
      const slow = new HttpClient({ timeout: 100 });
      const p = slow.get("/customers");
      jest.advanceTimersByTime(200);
      await expect(p).rejects.toMatchObject({ code: ERROR_CODES.REQUEST_TIMEOUT });
    });

    it("per-call timeout override respected", async () => {
      fetch.mockImplementation(() => new Promise(() => {}));
      const p = http.get("/customers/suggest", { timeout: 3_000 });
      jest.advanceTimersByTime(3_100);
      await expect(p).rejects.toMatchObject({ code: ERROR_CODES.REQUEST_TIMEOUT });
    });
  });

  // ── Abort ────────────────────────────────────────────────────────────────
  describe("abort signal", () => {
    it("throws REQUEST_ABORTED when signal aborts", async () => {
      const controller = new AbortController();
      fetch.mockImplementation(() => new Promise(() => {}));
      const p = http.get("/customers", { signal: controller.signal });
      controller.abort();
      await expect(p).rejects.toMatchObject({ code: ERROR_CODES.REQUEST_ABORTED });
    });
  });
});
