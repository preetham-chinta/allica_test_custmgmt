import { AppError }       from "@/errors/AppError";
import { ERROR_CODES }    from "@/constants/ErrorCodes";
import { HTTP_ERROR_MAP } from "@/constants/HttpErrorMap";
import { API_DEFAULTS }   from "@/constants/ApiEndpoints";
import { useAuthStore }   from "@/store";

/**
 * HttpClient — all HTTP transport concerns in one class.
 *
 * Auth:
 *   Reads token from useAuthStore.getState() on every request.
 *   Same pattern as CustomerService reading useBackendStore.getState() —
 *   Zustand's non-React escape hatch for code outside the component tree.
 *
 *   If token present → Authorization: Bearer <token>
 *   If no token      → request sent without auth header (dev profile = permitAll)
 *
 * Production (Next.js BFF mode):
 *   The browser sends an HttpOnly session cookie automatically.
 *   Next.js reads it server-side, attaches the JWT, proxies to Spring.
 *   No Authorization header needed from the browser — Next.js adds it.
 *   In that mode tokenStore would be empty and credentials:"include" sends the cookie.
 *
 * Timeout:
 *   Default 10s. Suggest endpoint uses 3s (typeahead is useless if slow).
 *   Implemented via AbortController + setTimeout.
 *
 * Signal (TanStack Query cancellation):
 *   TanStack creates an AbortController per query and passes its signal.
 *   We forward it to fetch so in-flight requests cancel on query invalidation.
 */
export class HttpClient {
  #baseURL;
  #defaultTimeout;

  constructor({ baseURL = "/api", timeout = API_DEFAULTS.TIMEOUT_MS } = {}) {
    this.#baseURL        = baseURL;
    this.#defaultTimeout = timeout;
  }

  get(endpoint, { version, params, signal, timeout } = {}) {
    const url = this.#buildUrl(endpoint, version, params);
    return this.#request(url, { method: "GET", signal, timeout });
  }

  post(endpoint, { version, body, signal, timeout } = {}) {
    const url = this.#buildUrl(endpoint, version);
    return this.#request(url, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(body),
      signal,
      timeout,
    });
  }

  // ── Private ───────────────────────────────────────────────────────────────

  #buildUrl(endpoint, version, params) {
    const versionSegment = version ? `/${version}` : "";
    const base           = `${this.#baseURL}${versionSegment}${endpoint}`;
    if (!params) return base;
    const qs = new URLSearchParams(
      Object.fromEntries(
        Object.entries(params).filter(([, v]) => v != null && v !== "")
      )
    );
    return `${base}?${qs}`;
  }

  async #request(url, { signal, timeout, headers = {}, ...fetchOptions }) {
    const timeoutMs         = timeout ?? this.#defaultTimeout;
    const timeoutController = new AbortController();
    const timeoutId         = setTimeout(
      () => timeoutController.abort("timeout"),
      timeoutMs
    );

    signal?.addEventListener("abort", () => timeoutController.abort("cancelled"),
      { once: true });

    // Read auth token from Zustand store — same pattern as CustomerService
    // reads useBackendStore.getState(). Works outside React component tree.
    const { token } = useAuthStore.getState();
    const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

    const finalHeaders = { ...headers, ...authHeader };

    try {
      const res = await fetch(url, {
        ...fetchOptions,
        headers:     finalHeaders,
        credentials: "same-origin",
        signal:      timeoutController.signal,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const code = HTTP_ERROR_MAP[res.status] ?? ERROR_CODES.UNKNOWN;
        throw new AppError(code, res.status, body.message ?? res.statusText);
      }

      if (res.status === 204) return null;
      return res.json();

    } catch (err) {
      if (err instanceof AppError) throw err;

      if (err.name === "AbortError") {
        const code = err.message === "timeout"
          ? ERROR_CODES.REQUEST_TIMEOUT
          : ERROR_CODES.REQUEST_ABORTED;
        throw new AppError(code, 0, err.message);
      }

      throw new AppError(ERROR_CODES.NETWORK_ERROR, 0, err.message);
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

export const http = new HttpClient();
