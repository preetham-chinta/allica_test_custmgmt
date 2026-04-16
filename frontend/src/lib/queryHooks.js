import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  keepPreviousData,
} from "@tanstack/react-query";

/**
 * Query hook wrappers — centralise repeated TanStack configuration.
 *
 * Every hook in this codebase uses these wrappers instead of calling
 * useQuery / useInfiniteQuery / useMutation directly. This gives us:
 *
 *   - Smart retry in one place: never retry 4xx (pointless), retry 5xx twice
 *   - Consistent staleTime, gcTime, refetchOnWindowFocus across all queries
 *   - AbortController signal passed automatically from TanStack to queryFn
 *   - Infinite query pagination contract defined once (getNextPageParam)
 *
 * Still fully escapable — pass anything in options to override defaults.
 * These are conventions, not constraints.
 *
 * Signal flow (AbortController):
 *   TanStack creates an AbortController per query.
 *   When a query becomes inactive (user typed something else, component
 *   unmounted, new queryKey), TanStack calls abort() on its controller.
 *   We receive the signal in queryFn and forward it to HttpClient,
 *   which passes it to fetch(). The request is cancelled immediately.
 *   No manual useRef needed — TanStack owns the lifecycle.
 */

const RETRY_POLICY = (failureCount, error) => {
  // Never retry client errors — a 409 or 404 won't change on retry
  if (error?.isClientError?.()) return false;
  if (error?.httpStatus >= 400 && error?.httpStatus < 500) return false;
  // Retry server errors and network errors up to twice
  return failureCount < 2;
};

const QUERY_DEFAULTS = {
  staleTime:            30_000,  // fresh for 30s — no refetch within window
  gcTime:              300_000,  // keep in memory 5min after unmount
  refetchOnWindowFocus:   true,  // silently revalidate when tab regains focus
  retry:            RETRY_POLICY,
};

/**
 * useServiceQuery — wraps useQuery.
 *
 * queryFn receives the TanStack signal automatically:
 *   useServiceQuery(key, (signal) => customerService.getAll({ signal }))
 */
export function useServiceQuery(queryKey, queryFn, options = {}) {
  return useQuery({
    queryKey,
    queryFn: ({ signal }) => queryFn(signal),
    ...QUERY_DEFAULTS,
    ...options,
  });
}

/**
 * useServiceInfiniteQuery — wraps useInfiniteQuery.
 *
 * queryFn receives (pageParam, signal):
 *   useServiceInfiniteQuery(key, (page, signal) => customerService.search(..., { signal }))
 *
 * Pagination contract — Spring's response shape:
 *   { results, totalHits, totalPages, page, size, query, took }
 */
export function useServiceInfiniteQuery(queryKey, queryFn, options = {}) {
  return useInfiniteQuery({
    queryKey,
    queryFn:          ({ signal, pageParam }) => queryFn(pageParam, signal),
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages - 1 ? lastPage.page + 1 : undefined,
    placeholderData:  keepPreviousData,
    ...QUERY_DEFAULTS,
    ...options,
  });
}

/**
 * useServiceMutation — wraps useMutation.
 *
 * Mutations are never retried — a duplicate POST causes a 409,
 * retrying it causes another 409. For writes, fail fast.
 */
export function useServiceMutation(mutationFn, options = {}) {
  return useMutation({
    mutationFn,
    retry: false,
    ...options,
  });
}
