import { useQueryClient }              from "@tanstack/react-query";
import { customerService }             from "@/services/CustomerService";
import { useServiceInfiniteQuery,
         useServiceMutation }          from "@/lib/queryHooks";
import { queryKeys }                   from "@/lib/queryClient";
import { useBackendStore }             from "@/store";
import { API_DEFAULTS }                from "@/constants/ApiEndpoints";

/**
 * useCustomers — infinite scroll list + create mutation.
 *
 * Receives deferredQuery from useCustomerSearch (via CustomerList).
 * deferredQuery updates in a lower-priority render — input stays
 * responsive while results update.
 *
 * queryKey includes backend + version so TanStack automatically
 * refetches when the user switches backend — no manual invalidation.
 *
 * Optimistic updates on create:
 *   New customer added to cache immediately.
 *   Rolled back automatically if server returns an error.
 */
export function useCustomers(searchQuery = "") {
  const { backend, version } = useBackendStore();

  const query = useServiceInfiniteQuery(
    queryKeys.customers.search({ q: searchQuery, backend, version }),
    (page, signal) => customerService.search(
      { query: searchQuery || undefined, page, size: API_DEFAULTS.PAGE_SIZE },
      { signal }
    )
  );

  const customers = query.data?.pages.flatMap(p => p.results ?? p) ?? [];

  return {
    customers,
    totalHits:          query.data?.pages[0]?.totalHits,
    isLoading:          query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage:        !!query.hasNextPage,
    fetchNextPage:      query.fetchNextPage,
    error:              query.error,
    refetch:            query.refetch,
  };
}

export function useCreateCustomer({ onSuccess, onError } = {}) {
  const qc = useQueryClient();

  return useServiceMutation(
    (data) => customerService.create(data),
    {
      // Optimistic update — show new customer before server confirms
      onMutate: async (newCustomer) => {
        await qc.cancelQueries({ queryKey: queryKeys.customers.all() });
        const snapshot = qc.getQueriesData({ queryKey: queryKeys.customers.all() });

        qc.setQueriesData({ queryKey: queryKeys.customers.all() }, (old) => {
          if (!old?.pages) return old;
          const optimistic = {
            id:          "temp-" + Date.now(),
            firstName:   newCustomer.firstName,
            lastName:    newCustomer.lastName,
            dateOfBirth: newCustomer.dateOfBirth,
            status:      "ACTIVE",
            createdAt:   new Date().toISOString(),
            _optimistic: true,
          };
          return {
            ...old,
            pages: [
              {
                ...old.pages[0],
                results: [optimistic, ...(old.pages[0]?.results ?? [])],
              },
              ...old.pages.slice(1),
            ],
          };
        });

        return { snapshot };
      },

      // Rollback on error
      onError: (err, _vars, context) => {
        context?.snapshot?.forEach(([key, data]) => qc.setQueryData(key, data));
        onError?.(err);
      },

      onSuccess: (result) => {
        qc.invalidateQueries({ queryKey: queryKeys.customers.all() });
        onSuccess?.(result);
      },
    }
  );
}
