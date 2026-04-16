import { useRef, useEffect }  from "react";
import TextField              from "@mui/material/TextField";
import InputAdornment         from "@mui/material/InputAdornment";
import IconButton             from "@mui/material/IconButton";
import Paper                  from "@mui/material/Paper";
import List                   from "@mui/material/List";
import ListItem               from "@mui/material/ListItem";
import ListItemButton         from "@mui/material/ListItemButton";
import ListItemIcon           from "@mui/material/ListItemIcon";
import ListItemText           from "@mui/material/ListItemText";
import Typography             from "@mui/material/Typography";
import Box                    from "@mui/material/Box";
import SearchIcon             from "@mui/icons-material/Search";
import CloseIcon              from "@mui/icons-material/Close";
import HistoryIcon            from "@mui/icons-material/History";

/**
 * SearchField — MUI TextField with:
 *   - Search icon adornment (left)
 *   - Clear button (right, when value present)
 *   - Typeahead suggestions dropdown (absolute positioned)
 *   - Recent search history chips (when input empty)
 *   - Keyboard navigation (↑↓ Escape)
 *   - Full ARIA: searchbox role, aria-expanded, aria-controls, aria-autocomplete
 *
 * Extracted as a generic component — works for any entity, not just customers.
 */
export function SearchField({
  value          = "",
  onChange,
  onClear,
  onSelectSuggestion,
  suggestions    = [],
  showSuggestions = false,
  onHideSuggestions,
  history        = [],
  onSelectHistory,
  placeholder    = "Search…",
  label,
  inputRef: externalRef,
}) {
  const containerRef = useRef(null);
  const internalRef  = useRef(null);
  const inputRef     = externalRef ?? internalRef;

  const hasSuggestions = showSuggestions && suggestions.length > 0;
  const hasHistory     = !value && history.length > 0;

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (!containerRef.current?.contains(e.target)) onHideSuggestions?.();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onHideSuggestions]);

  const handleKeyDown = (e) => {
    if (e.key === "Escape") { onHideSuggestions?.(); return; }
    if (e.key === "ArrowDown" && hasSuggestions) {
      e.preventDefault();
      containerRef.current?.querySelector("[role='option']")?.focus();
    }
  };

  const handleOptionKeyDown = (e, value, idx, list) => {
    if (e.key === "Enter")  { e.preventDefault(); list === "suggestions" ? onSelectSuggestion?.(value) : onSelectHistory?.(value); return; }
    if (e.key === "Escape") { onHideSuggestions?.(); inputRef.current?.focus(); return; }
    const options = containerRef.current?.querySelectorAll("[role='option']");
    if (e.key === "ArrowDown") { e.preventDefault(); options?.[idx + 1]?.focus(); }
    if (e.key === "ArrowUp")   { e.preventDefault(); idx === 0 ? inputRef.current?.focus() : options?.[idx - 1]?.focus(); }
  };

  return (
    <Box ref={containerRef} sx={{ position: "relative" }}>
      <TextField
        inputRef={inputRef}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        label={label}
        autoComplete="off"
        inputProps={{
          role:              "searchbox",
          "aria-label":     label ?? placeholder,
          "aria-autocomplete": "list",
          "aria-expanded":  hasSuggestions,
          "aria-controls":  hasSuggestions ? "search-suggestions" : undefined,
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ fontSize: 18, color: "text.disabled" }} />
            </InputAdornment>
          ),
          endAdornment: value ? (
            <InputAdornment position="end">
              <IconButton
                size="small"
                onClick={onClear}
                aria-label="Clear search"
                edge="end"
              >
                <CloseIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </InputAdornment>
          ) : null,
        }}
      />

      {/* Suggestions dropdown */}
      {hasSuggestions && (
        <Paper
          id="search-suggestions"
          elevation={2}
          sx={{
            position:   "absolute",
            top:        "calc(100% + 4px)",
            left:       0,
            right:      0,
            zIndex:     1300,
            overflow:   "hidden",
            border:     "1px solid",
            borderColor: "divider",
          }}
        >
          <List dense disablePadding role="listbox" aria-label="Suggestions">
            {suggestions.map((s, i) => (
              <ListItem key={s} disablePadding>
                <ListItemButton
                  role="option"
                  tabIndex={0}
                  aria-selected={false}
                  onClick={() => onSelectSuggestion?.(s)}
                  onKeyDown={(e) => handleOptionKeyDown(e, s, i, "suggestions")}
                  sx={{ py: 0.75, px: 2 }}
                >
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <SearchIcon sx={{ fontSize: 14, color: "text.disabled" }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={s}
                    primaryTypographyProps={{ variant: "body2" }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      {/* Recent history — shown when input is empty */}
      {hasHistory && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1, flexWrap: "wrap" }}>
          <Typography variant="overline" color="text.disabled" sx={{ lineHeight: 1 }}>
            Recent
          </Typography>
          {history.map((q, i) => (
            <Box
              key={q}
              component="button"
              role="option"
              tabIndex={0}
              onClick={() => onSelectHistory?.(q)}
              onKeyDown={(e) => handleOptionKeyDown(e, q, i, "history")}
              sx={{
                display:      "inline-flex",
                alignItems:   "center",
                gap:          0.5,
                px:           1.25,
                py:           0.25,
                border:       "1px solid",
                borderColor:  "divider",
                borderRadius: "999px",
                background:   "transparent",
                cursor:       "pointer",
                fontSize:     "0.75rem",
                color:        "text.secondary",
                fontFamily:   "inherit",
                transition:   "all 0.12s",
                "&:hover":    { borderColor: "primary.main", color: "primary.main" },
              }}
            >
              <HistoryIcon sx={{ fontSize: 12 }} />
              {q}
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
