import { http }             from "@/lib/HttpClient";
import { useBackendStore }   from "@/store";
import {
  ENDPOINTS, API_VERSIONS, API_DEFAULTS,
}                            from "@/constants/ApiEndpoints";
import {
  DuplicateCustomerError,
  CustomerNotFoundError,
}                            from "@/errors/CustomerErrors";
import { ERROR_CODES }       from "@/constants/ErrorCodes";

/**
 * CustomerService — all customer domain operations.
 *
 * Structure:
 *   Queries  — read operations (GET). No side effects.
 *   Commands — write operations (POST). Side effects.
 *
 * Mirrors the CQRS split in the Spring backend.
 *
 * Reading backend state outside React:
 *   useBackendStore.getState() — Zustand's built-in escape hatch.
 *   Reads current state synchronously. No subscription, no BehaviorSubject.
 *
 * Error mapping:
 *   HttpClient throws AppError (typed code).
 *   Service catches and rethrows as domain errors.
 *   Nothing above this layer sees HTTP status codes.
 */
class CustomerService {

  // ── Private state access ──────────────────────────────────────────────────

  #version()  { return useBackendStore.getState().version; }
  #backend()  { return useBackendStore.getState().backend; }

  // ── Queries ───────────────────────────────────────────────────────────────

  getAll({ signal } = {}) {
    return http.get(ENDPOINTS.CUSTOMERS(), {
      version: this.#version(),
      signal,
    });
  }

  async getById(id, { signal } = {}) {
    try {
      return await http.get(ENDPOINTS.CUSTOMER(id), {
        version: this.#version(),
        signal,
      });
    } catch (err) {
      if (err.code === ERROR_CODES.CUSTOMER_NOT_FOUND)
        throw new CustomerNotFoundError(err.serverMessage);
      throw err;
    }
  }

  /**
   * Full-text search.
   * V1 → GET with query params (basic)
   * V2 → POST with body (fuzzy, ranges, sorting)
   */
  search(params, { signal } = {}) {
    const version = this.#version();

    if (version === API_VERSIONS.V2) {
      return http.post(ENDPOINTS.CUSTOMERS_SEARCH(), {
        version, body: params, signal,
      });
    }

    return http.get(ENDPOINTS.CUSTOMERS_SEARCH(), {
      version,
      params: {
        query:   params.query,
        page:    params.page,
        size:    params.size ?? API_DEFAULTS.PAGE_SIZE,
        sortBy:  params.sortBy,
        sortDir: params.sortDir,
      },
      signal,
    });
  }

  /**
   * Typeahead prefix suggestions.
   * Always V2 — suggest endpoint only exists on V2.
   * Tight 3s timeout — stale suggestions are useless.
   */
  suggest(prefix, limit = API_DEFAULTS.SUGGEST_LIMIT) {
    return http.get(ENDPOINTS.CUSTOMERS_SUGGEST(), {
      version: API_VERSIONS.V2,
      params:  { prefix, limit },
      timeout: API_DEFAULTS.SUGGEST_TIMEOUT,
    });
  }

  // ── Commands ──────────────────────────────────────────────────────────────

  async create(data) {
    try {
      return await http.post(ENDPOINTS.CUSTOMERS(), {
        version: this.#version(),
        body:    data,
      });
    } catch (err) {
      if (err.code === ERROR_CODES.DUPLICATE_CUSTOMER)
        throw new DuplicateCustomerError(err.serverMessage);
      throw err;
    }
  }
}

export const customerService = new CustomerService();
