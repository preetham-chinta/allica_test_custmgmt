import Paper           from "@mui/material/Paper";
import Table           from "@mui/material/Table";
import TableBody       from "@mui/material/TableBody";
import TableCell       from "@mui/material/TableCell";
import TableContainer  from "@mui/material/TableContainer";
import TableHead       from "@mui/material/TableHead";
import TableRow        from "@mui/material/TableRow";
import TableSortLabel  from "@mui/material/TableSortLabel";
import Skeleton        from "@mui/material/Skeleton";
import Typography      from "@mui/material/Typography";
import Box             from "@mui/material/Box";

/**
 * DataTable — generic, reusable data table.
 *
 * Column definition shape:
 *   {
 *     field:    string           — key in data row object
 *     header:   string           — column heading text
 *     sortable: boolean          — show sort label in header
 *     width:    string|number    — optional column width
 *     align:    "left"|"right"|"center"
 *     render:   (row) => ReactNode  — custom cell renderer
 *   }
 *
 * Features:
 *   - Skeleton rows while loading (preserves table layout, no CLS)
 *   - Sortable columns via TableSortLabel (controlled — parent owns sort state)
 *   - Custom cell renderers for badges, dates, formatted values
 *   - Empty state when rows.length === 0
 *   - Row count footer
 *
 * The component is generic — no customer-specific logic.
 * Pass any columns + rows, it works for any entity.
 */
export function DataTable({
  columns,
  rows        = [],
  loading     = false,
  sortField,
  sortDir     = "asc",
  onSort,
  emptyMessage = "No data found.",
  rowKey      = "id",
  footer,
  "aria-label": ariaLabel,
}) {
  const handleSort = (field) => {
    if (!onSort) return;
    const nextDir = sortField === field && sortDir === "asc" ? "desc" : "asc";
    onSort(field, nextDir);
  };

  const SKELETON_ROWS = 6;

  return (
    <TableContainer component={Paper}>
      <Table aria-label={ariaLabel} aria-busy={loading}>

        {/* ── Header ─────────────────────────────────────────────────── */}
        <TableHead>
          <TableRow>
            {columns.map(col => (
              <TableCell
                key={col.field}
                align={col.align ?? "left"}
                width={col.width}
                sortDirection={sortField === col.field ? sortDir : false}
              >
                {col.sortable ? (
                  <TableSortLabel
                    active={sortField === col.field}
                    direction={sortField === col.field ? sortDir : "asc"}
                    onClick={() => handleSort(col.field)}
                  >
                    {col.header}
                  </TableSortLabel>
                ) : col.header}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>

        {/* ── Body ───────────────────────────────────────────────────── */}
        <TableBody>
          {loading ? (
            // Skeleton rows — same layout as real rows, no layout shift
            Array.from({ length: SKELETON_ROWS }).map((_, i) => (
              <TableRow key={i} aria-hidden="true">
                {columns.map(col => (
                  <TableCell key={col.field} align={col.align ?? "left"}>
                    <Skeleton variant="text" width={col.skeletonWidth ?? "60%"} height={20} />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : rows.length === 0 ? (
            // Empty state
            <TableRow>
              <TableCell colSpan={columns.length} align="center" sx={{ py: 6 }}>
                <Typography variant="body2" color="text.secondary">
                  {emptyMessage}
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            // Data rows
            rows.map((row, idx) => (
              <TableRow
                key={row[rowKey] ?? idx}
                hover
                sx={row._optimistic ? { opacity: 0.6 } : undefined}
              >
                {columns.map(col => (
                  <TableCell key={col.field} align={col.align ?? "left"}>
                    {col.render ? col.render(row) : row[col.field]}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      {!loading && rows.length > 0 && (
        <Box sx={{ px: 2, py: 1, borderTop: "1px solid", borderColor: "divider" }}>
          {footer ?? (
            <Typography variant="caption" color="text.secondary">
              {rows.length} record{rows.length !== 1 ? "s" : ""}
            </Typography>
          )}
        </Box>
      )}
    </TableContainer>
  );
}
