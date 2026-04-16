/**
 * API contract constants.
 *
 * Three concerns — all relate to the API shape:
 *   API_VERSIONS  — version strings, never inline "v1" / "v2"
 *   API_DEFAULTS  — page size, timeouts, limits
 *   ENDPOINTS     — path builders, never raw strings
 *
 * Why builders instead of strings:
 *   ENDPOINTS.CUSTOMER(id)   → breaks at call site if id is undefined
 *   "/customers/" + id       → silent bug, produces "/customers/undefined"
 */

export const API_VERSIONS = {
  V1: "v1",
  V2: "v2",
};

export const API_DEFAULTS = {
  TIMEOUT_MS:      10_000,  // default request timeout
  SUGGEST_TIMEOUT:  3_000,  // typeahead timeout — no value after 3s
  PAGE_SIZE:            12,  // items per infinite scroll page
  SUGGEST_LIMIT:         5,  // max suggestions shown
  DEBOUNCE_MS:         300,  // search input debounce delay
  MIN_QUERY_LENGTH:      2,  // minimum chars before search fires
};

export const ENDPOINTS = {
  CUSTOMERS:         ()    => "/customers",
  CUSTOMER:          (id)  => `/customers/${id}`,
  CUSTOMERS_SEARCH:  ()    => "/customers/search",
  CUSTOMERS_SUGGEST: ()    => "/customers/suggest",
  CUSTOMERS_REINDEX: ()    => "/customers/reindex",
};
