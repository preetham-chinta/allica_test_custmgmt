import MuiButton          from "@mui/material/Button";
import CircularProgress   from "@mui/material/CircularProgress";

/**
 * Button — wrapper over MuiButton.
 *
 * Adds:
 *   loading — shows spinner and disables the button while async work runs.
 *             The button keeps its width so the layout doesn't shift.
 *
 * All MuiButton props pass through — variant, color, size, onClick, etc.
 * Consumers never import from @mui/material directly.
 */
export function Button({ loading = false, disabled, children, sx, ...props }) {
  return (
    <MuiButton
      disabled={disabled || loading}
      sx={{ minWidth: 100, ...sx }}
      {...props}
    >
      {loading
        ? <CircularProgress size={16} color="inherit" thickness={4} />
        : children
      }
    </MuiButton>
  );
}
