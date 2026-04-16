import { createTheme } from "@mui/material/styles";

/**
 * MUI theme — single source of truth for all visual decisions.
 *
 * Matches our CSS custom properties in index.css so both MUI components
 * and any hand-written CSS share the same palette, radius, and typography.
 *
 * Global component overrides via `components` key mean we never have to
 * pass the same props repeatedly — `disableElevation`, `size`, `variant`
 * are set once here and inherited everywhere.
 */
export const theme = createTheme({
  palette: {
    primary: {
      main:  "#2563eb",
      dark:  "#1d4ed8",
      light: "#eff6ff",
      contrastText: "#ffffff",
    },
    error: {
      main:  "#dc2626",
      light: "#fef2f2",
    },
    success: {
      main:  "#16a34a",
      light: "#f0fdf4",
    },
    warning: {
      main:  "#d97706",
      light: "#fffbeb",
    },
    grey: {
      50:  "#f4f6f9",
      100: "#eef1f6",
      200: "#e2e8f0",
      500: "#94a3b8",
      700: "#475569",
      900: "#0f172a",
    },
    text: {
      primary:   "#0f172a",
      secondary: "#475569",
      disabled:  "#94a3b8",
    },
    background: {
      default: "#f4f6f9",
      paper:   "#ffffff",
    },
    divider: "rgba(0, 0, 0, 0.08)",
  },

  typography: {
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize:   14,
    fontWeightRegular: 400,
    fontWeightMedium:  500,
    fontWeightBold:    600,
    h5: { fontSize: "1.25rem", fontWeight: 600, letterSpacing: "-0.01em" },
    h6: { fontSize: "1rem",    fontWeight: 600, letterSpacing: "-0.01em" },
    body1: { fontSize: "0.9375rem", lineHeight: 1.6 },
    body2: { fontSize: "0.875rem",  lineHeight: 1.5 },
    caption: { fontSize: "0.75rem", color: "#475569" },
    overline: { fontSize: "0.6875rem", fontWeight: 600,
                letterSpacing: "0.06em", textTransform: "uppercase" },
  },

  shape: { borderRadius: 8 },

  shadows: [
    "none",
    "0 1px 2px rgba(0,0,0,.06), 0 1px 3px rgba(0,0,0,.04)",  // 1 — sm
    "0 4px 6px rgba(0,0,0,.05), 0 2px 4px rgba(0,0,0,.04)",  // 2 — md
    "0 8px 16px rgba(0,0,0,.07)",                              // 3 — lg
    ...Array(21).fill("none"),                                 // 4-24 unused
  ],

  components: {
    // ── Button ───────────────────────────────────────────────────────────
    MuiButton: {
      defaultProps: {
        disableElevation: true,
        size:             "medium",
        variant:          "contained",
      },
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight:    500,
          borderRadius:  8,
          padding:       "8px 18px",
        },
        sizeSmall: { padding: "5px 12px", fontSize: "0.8125rem" },
      },
    },

    // ── TextField ────────────────────────────────────────────────────────
    MuiTextField: {
      defaultProps: {
        size:    "small",
        variant: "outlined",
        fullWidth: true,
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: "#f4f6f9",
          borderRadius: 8,
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "#2563eb",
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "#2563eb",
            borderWidth:  1,
          },
        },
        notchedOutline: { borderColor: "rgba(0,0,0,0.12)" },
      },
    },

    // ── Table ────────────────────────────────────────────────────────────
    MuiTable: {
      defaultProps: { size: "medium" },
    },
    MuiTableHead: {
      styleOverrides: {
        root: { backgroundColor: "#f4f6f9" },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight:      600,
          fontSize:        "0.75rem",
          textTransform:   "uppercase",
          letterSpacing:   "0.05em",
          color:           "#475569",
          padding:         "12px 16px",
          borderBottom:    "1px solid rgba(0,0,0,0.08)",
          whiteSpace:      "nowrap",
        },
        body: {
          padding:         "13px 16px",
          fontSize:        "0.875rem",
          color:           "#0f172a",
          borderBottom:    "1px solid rgba(0,0,0,0.06)",
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          "&:last-child td": { borderBottom: "none" },
          "&:hover":         { backgroundColor: "#f4f6f9" },
        },
      },
    },
    MuiTableSortLabel: {
      styleOverrides: {
        root: {
          color:       "#475569",
          fontWeight:  600,
          fontSize:    "0.75rem",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          "&.Mui-active": { color: "#2563eb" },
          "&:hover":      { color: "#0f172a" },
        },
        icon: { fontSize: "0.875rem" },
      },
    },

    // ── Paper ────────────────────────────────────────────────────────────
    MuiPaper: {
      defaultProps: { elevation: 0, variant: "outlined" },
      styleOverrides: {
        root: { borderRadius: 10, borderColor: "rgba(0,0,0,0.08)" },
        outlined: { border: "1px solid rgba(0,0,0,0.08)" },
      },
    },

    // ── Chip ─────────────────────────────────────────────────────────────
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight:  600,
          fontSize:    "0.6875rem",
          height:      22,
          borderRadius: 999,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
        },
        label: { paddingLeft: 8, paddingRight: 8 },
      },
    },

    // ── Alert ────────────────────────────────────────────────────────────
    MuiAlert: {
      defaultProps: { variant: "outlined" },
      styleOverrides: {
        root: { borderRadius: 8, fontSize: "0.875rem" },
      },
    },

    // ── Avatar ───────────────────────────────────────────────────────────
    MuiAvatar: {
      styleOverrides: {
        root: { fontWeight: 700, fontSize: "0.8125rem", letterSpacing: "0.02em" },
      },
    },

    // ── AppBar ───────────────────────────────────────────────────────────
    MuiAppBar: {
      defaultProps: { elevation: 0, color: "inherit" },
      styleOverrides: {
        root: {
          backgroundColor: "#ffffff",
          borderBottom:    "1px solid rgba(0,0,0,0.08)",
        },
      },
    },

    // ── ToggleButton ─────────────────────────────────────────────────────
    MuiToggleButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight:    500,
          fontSize:      "0.75rem",
          padding:       "3px 10px",
          border:        "1px solid rgba(0,0,0,0.12)",
          color:         "#475569",
          "&.Mui-selected": {
            backgroundColor: "#2563eb",
            color:           "#ffffff",
            "&:hover":       { backgroundColor: "#1d4ed8" },
          },
        },
      },
    },

    // ── Tooltip ──────────────────────────────────────────────────────────
    MuiTooltip: {
      defaultProps: { arrow: true, placement: "top" },
      styleOverrides: {
        tooltip: { fontSize: "0.75rem", borderRadius: 6 },
      },
    },
  },
});
