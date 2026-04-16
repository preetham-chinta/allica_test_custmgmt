import { QueryClient } from "@tanstack/react-query";

/**
 * Query key factory — structured keys prevent cache collisions.
 *
 * Hierarchical: queryKeys.customers.all() invalidates everything
 * underneath it — list, search, detail — in one call.
 *
 *   qc.invalidateQueries({ queryKey: queryKeys.customers.all() })
 *   → invalidates list, search results, suggestions, detail pages
 */
export const queryKeys = {
  customers: {
    all:     ()       => ["customers"],
    list:    (v)      => ["customers", "list", v],
    detail:  (id)     => ["customers", "detail", id],
    search:  (params) => ["customers", "search", params],
    suggest: (prefix) => ["customers", "suggest", prefix],
  },
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:            30_000,   // fresh for 30s — no refetch within window
      gcTime:              300_000,   // keep in memory 5min after unmount
      refetchOnWindowFocus:   true,   // silently revalidate on tab focus
      /**
       * Smart retry — don't retry client errors.
       * A 409 (duplicate) or 404 won't change on retry.
       * Retry server errors (5xx) and network failures up to twice.
       */
      retry: (failureCount, error) => {
        if (error?.httpStatus >= 400 && error?.httpStatus < 500) return false;
        return failureCount < 2;
      },
    },
    mutations: {
      retry: false,   // never retry mutations — fail fast on writes
    },
  },
});
