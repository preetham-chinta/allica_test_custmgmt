import Avatar    from "@mui/material/Avatar";
import Box       from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { Badge } from "@/components/ui";

/**
 * CustomerCard — single row in the customer feed (card-style layout).
 *
 * Used inside DataTable via the column render prop — keeps the table
 * generic while CustomerCard owns how a customer looks.
 *
 * Could also be used outside the table (search results, related records)
 * because it accepts a plain customer object with no table coupling.
 */

const AVATAR_COLORS = [
  "#3b82f6","#8b5cf6","#10b981",
  "#f59e0b","#ef4444","#06b6d4",
];

function Highlight({ text, query }) {
  if (!query || query.length < 2 || !text) return <>{text}</>;
  const re = new RegExp(
    `(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"
  );
  return (
    <>
      {text.split(re).map((part, i) =>
        re.test(part)
          ? <mark key={i} style={{ background: "#fde047", padding: "0 1px", borderRadius: 2 }}>{part}</mark>
          : <span key={i}>{part}</span>
      )}
    </>
  );
}

export function CustomerCard({ customer, highlight = "" }) {
  const color    = AVATAR_COLORS[(customer.id ?? 0) % AVATAR_COLORS.length];
  const initials = `${customer.firstName?.[0] ?? ""}${customer.lastName?.[0] ?? ""}`.toUpperCase();

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
      <Avatar
        sx={{
          bgcolor:  color,
          width:    36,
          height:   36,
          fontSize: "0.8125rem",
        }}
        aria-hidden="true"
      >
        {initials}
      </Avatar>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="body2" fontWeight={500} noWrap>
          <Highlight text={customer.firstName} query={highlight} />{" "}
          <Highlight text={customer.lastName}  query={highlight} />
          {customer._optimistic && (
            <Typography component="span" variant="caption"
                        color="text.disabled" sx={{ ml: 0.75 }}>
              saving…
            </Typography>
          )}
        </Typography>
      </Box>
    </Box>
  );
}
