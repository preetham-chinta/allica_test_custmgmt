/**
 * UI component library — barrel export.
 *
 * RULE: @mui/material is ONLY imported inside src/components/ui/
 *       Every other file imports from "@/components/ui" only.
 *
 * Why this matters:
 *   - One place to change if we swap MUI for another library
 *   - Enforces our prop API over MUI's raw API
 *   - Shared defaults (theme, size, variant) applied once
 *   - Consumers never know which library is underneath
 */

export { Button }                                        from "./Button";
export { DataTable }                                     from "./DataTable";
export { SearchField }                                   from "./SearchField";
export { Badge, PageHeader, LoadingSpinner,
         EmptyState, ErrorAlert }                        from "./Primitives";
export { theme }                                         from "./theme";
