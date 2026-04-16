import Chip        from "@mui/material/Chip";
import Box         from "@mui/material/Box";
import Typography  from "@mui/material/Typography";
import Alert       from "@mui/material/Alert";
import AlertTitle  from "@mui/material/AlertTitle";
import MuiButton   from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";

/**
 * Badge — MUI Chip styled for entity status display.
 *
 * Status → colour mapping:
 *   ACTIVE    → success (green)
 *   INACTIVE  → default (grey)
 *   SUSPENDED → error  (red)
 *
 * Generic by design — pass any status string, it maps to the right colour.
 */
export function Badge({ status, label, ...props }) {
  const display = label ?? status ?? "—";

  const colorMap = {
    ACTIVE:    "success",
    INACTIVE:  "default",
    SUSPENDED: "error",
    ERROR:     "error",
    WARNING:   "warning",
  };

  return (
    <Chip
      label={display}
      color={colorMap[status?.toUpperCase()] ?? "default"}
      size="small"
      variant="outlined"
      {...props}
    />
  );
}

/**
 * PageHeader — section title with optional subtitle and action slot.
 * Used inside PageSection for consistent heading hierarchy.
 */
export function PageHeader({ title, subtitle, action, sx }) {
  return (
    <Box
      sx={{
        display:        "flex",
        alignItems:     "center",
        justifyContent: "space-between",
        ...sx,
      }}
    >
      <Box>
        <Typography variant="h6" component="h2" gutterBottom={!!subtitle}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Box>
      {action && <Box sx={{ flexShrink: 0 }}>{action}</Box>}
    </Box>
  );
}

/**
 * LoadingSpinner — centred CircularProgress for load-more and page-level loading.
 */
export function LoadingSpinner({ size = 28, label = "Loading…", py = 2 }) {
  return (
    <Box
      sx={{ display: "flex", justifyContent: "center", py }}
      role="status"
      aria-label={label}
    >
      <CircularProgress size={size} thickness={3} />
    </Box>
  );
}

/**
 * EmptyState — centred empty content with icon, title, and message.
 * Used when a list or table has no rows to show.
 */
export function EmptyState({ icon = "📭", title, message, action, py = 6 }) {
  return (
    <Box
      sx={{
        display:        "flex",
        flexDirection:  "column",
        alignItems:     "center",
        textAlign:      "center",
        py,
        color:          "text.disabled",
      }}
      role="status"
    >
      <Typography sx={{ fontSize: "2rem", mb: 1.5 }} aria-hidden="true">
        {icon}
      </Typography>
      <Typography variant="h6" color="text.secondary" gutterBottom>
        {title}
      </Typography>
      {message && (
        <Typography variant="body2" color="text.disabled" sx={{ maxWidth: 320 }}>
          {message}
        </Typography>
      )}
      {action && <Box sx={{ mt: 2 }}>{action}</Box>}
    </Box>
  );
}

/**
 * ErrorAlert — MUI Alert with an optional retry button.
 * Used when a fetch fails or a form submission errors.
 */
export function ErrorAlert({ title = "Something went wrong", message, onRetry, sx }) {
  return (
    <Alert
      severity="error"
      sx={{ borderRadius: 1.5, ...sx }}
      action={
        onRetry && (
          <MuiButton
            color="error"
            size="small"
            onClick={onRetry}
            sx={{ textTransform: "none", fontWeight: 500 }}
          >
            Try again
          </MuiButton>
        )
      }
    >
      {title && <AlertTitle sx={{ fontWeight: 600 }}>{title}</AlertTitle>}
      {message}
    </Alert>
  );
}
