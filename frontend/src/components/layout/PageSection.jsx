import Paper     from "@mui/material/Paper";
import Box       from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Divider   from "@mui/material/Divider";

/**
 * PageSection — reusable section wrapper built on MUI Paper.
 *
 * Gives every section a consistent:
 *   - Bordered Paper card (from theme — elevation 0, outlined variant)
 *   - Section header with title (h2) and optional action slot
 *   - Divider between header and body
 *   - Consistent padding
 *
 * All sections on the page use this — Add Customer and Customer List.
 * Extracted once, used everywhere.
 */
export function PageSection({ id, title, subtitle, action, children }) {
  const headingId = `${id}-heading`;

  return (
    <Paper
      component="section"
      aria-labelledby={headingId}
    >
      {/* Header */}
      <Box sx={{
        display:        "flex",
        alignItems:     "center",
        justifyContent: "space-between",
        px: 3, py: 2,
      }}>
        <Box>
          <Typography
            id={headingId}
            variant="h6"
            component="h2"
          >
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

      <Divider />

      {/* Body */}
      <Box sx={{ px: 3, py: 2.5 }}>
        {children}
      </Box>
    </Paper>
  );
}
