import Box       from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Divider   from "@mui/material/Divider";

export function AppFooter() {
  return (
    <Box component="footer" role="contentinfo" sx={{ mt: "auto" }}>
      <Divider />
      <Box sx={{
        display: "flex", alignItems: "center", gap: 1.5,
        maxWidth: 900, mx: "auto", px: 3, py: 2,
      }}>
        <Typography variant="caption" color="text.disabled">
          Allica Bank — Technical Assessment
        </Typography>
        <Typography variant="caption" color="text.disabled">·</Typography>
        <Typography variant="caption" color="text.disabled">
          Spring MVC · Spring WebFlux · React · MUI v5
        </Typography>
      </Box>
    </Box>
  );
}
