import { useState }               from "react";
import Box                        from "@mui/material/Box";
import Typography                 from "@mui/material/Typography";
import { useCustomers }           from "@/hooks/useCustomers";
import { useCustomerSearch }      from "@/hooks/useCustomerSearch";
import { useInfiniteScroll }      from "@/hooks/useInfiniteScroll";
import { CustomerCard }           from "./CustomerCard";
import {
  DataTable, SearchField,
  Badge, LoadingSpinner, EmptyState, ErrorAlert,
}                                 from "@/components/ui";
import { API_DEFAULTS }           from "@/constants/ApiEndpoints";

/**
 * Column definitions for the customer DataTable.
 *
 * Each column is declared once here — DataTable renders the header
 * and cell generically. CustomerCard and Badge are injected via render().
 *
 * This is the only place that knows:
 *   - What columns to show
 *   - How to format dates
 *   - Which fields are sortable
 *   - How status is displayed
 *
 * DataTable itself knows none of this — it's truly generic.
 */
function buildColumns(highlight) {
  return [
    {
      field:         "name",
      header:        "Customer",
      sortable:      true,
      skeletonWidth: "70%",
      render: (row) => <CustomerCard customer={row} highlight={highlight} />,
    },
    {
      field:         "dateOfBirth",
      header:        "Date of birth",
      sortable:      true,
      skeletonWidth: "50%",
      render: (row) =>
        new Date(row.dateOfBirth).toLocaleDateString("en-GB"),
    },
    {
      field:         "status",
      header:        "Status",
      sortable:      false,
      skeletonWidth: "40%",
      render: (row) =>
        row.status ? <Badge status={row.status} /> : null,
    },
    {
      field:         "createdAt",
      header:        "Created",
      sortable:      true,
      skeletonWidth: "45%",
      render: (row) =>
        new Date(row.createdAt).toLocaleDateString("en-GB"),
    },
  ];
}

/**
 * CustomerList — SearchField above DataTable with infinite scroll.
 *
 * Architecture:
 *   useCustomerSearch → input state, debounce, deferredQuery, isStale, suggestions
 *   useCustomers(deferredQuery) → infinite query pages, optimistic updates
 *   useInfiniteScroll → IntersectionObserver fires fetchNextPage at list bottom
 *   DataTable → generic rendering, sort state managed locally here
 *   CustomerCard → injected via column render()
 *
 * isStale dimming:
 *   While useDeferredValue prepares the next render, the table dims to 60%.
 *   Previous results stay visible — no blank flash between searches.
 */
export function CustomerList() {
  const search = useCustomerSearch();
  const [sortField, setSortField] = useState("createdAt");
  const [sortDir,   setSortDir]   = useState("desc");

  const {
    customers, totalHits, isLoading,
    isFetchingNextPage, hasNextPage, fetchNextPage,
    error, refetch,
  } = useCustomers(search.deferredQuery);

  const sentinelRef = useInfiniteScroll(fetchNextPage, hasNextPage);

  const handleSort = (field, dir) => {
    setSortField(field);
    setSortDir(dir);
  };

  // Client-side sort — server-side sort would pass these to CustomerService
  const sorted = [...customers].sort((a, b) => {
    const aVal = a[sortField] ?? "";
    const bVal = b[sortField] ?? "";
    const cmp  = String(aVal).localeCompare(String(bVal), "en", { numeric: true });
    return sortDir === "asc" ? cmp : -cmp;
  });

  if (error) {
    return (
      <ErrorAlert
        title="Failed to load customers"
        message={error.userMessage ?? error.message}
        onRetry={refetch}
      />
    );
  }

  return (
    <Box>
      {/* Search field — sits above the table */}
      <Box sx={{ mb: 2 }}>
        <SearchField
          value={search.inputValue}
          onChange={search.setQuery}
          onClear={search.clear}
          suggestions={search.suggestions}
          showSuggestions={search.showSuggestions}
          onSelectSuggestion={search.selectSuggestion}
          onHideSuggestions={() => search.setShowSuggestions(false)}
          onSelectHistory={search.setQuery}
          history={search.history}
          inputRef={search.inputRef}
          placeholder="Search customers by name…"
          label="Search"
        />
      </Box>

      {/* Result count when actively searching */}
      {search.committedQuery && !isLoading && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          {totalHits === 0
            ? `No results for "${search.committedQuery}"`
            : `${(totalHits ?? 0).toLocaleString()} result${totalHits !== 1 ? "s" : ""} for "${search.committedQuery}"`
          }
        </Typography>
      )}

      {/* Table dims while useDeferredValue prepares next render */}
      <Box sx={{
        opacity:    search.isStale ? 0.6 : 1,
        transition: "opacity 0.2s",
      }}>
        <DataTable
          aria-label="Customer list"
          columns={buildColumns(search.deferredQuery)}
          rows={sorted}
          loading={isLoading}
          sortField={sortField}
          sortDir={sortDir}
          onSort={handleSort}
          emptyMessage={
            search.committedQuery
              ? `No customers found matching "${search.committedQuery}".`
              : "No customers yet. Create the first one above."
          }
          footer={
            !isLoading && customers.length > 0 && (
              <Typography variant="caption" color="text.secondary">
                {customers.length} customer{customers.length !== 1 ? "s" : ""} loaded
                {hasNextPage && " · scroll for more"}
              </Typography>
            )
          }
        />
      </Box>

      {/* Infinite scroll sentinel — IntersectionObserver target */}
      <div ref={sentinelRef} aria-hidden="true" style={{ height: 1 }} />

      {isFetchingNextPage && <LoadingSpinner py={2} label="Loading more customers" />}

      {!hasNextPage && customers.length > API_DEFAULTS.PAGE_SIZE && (
        <Typography variant="caption" color="text.disabled"
                    sx={{ display: "block", textAlign: "center", mt: 1.5 }}>
          All {customers.length} customers loaded
        </Typography>
      )}
    </Box>
  );
}
