import { useEffect }       from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Box                from "@mui/material/Box";
import Paper              from "@mui/material/Paper";
import Typography         from "@mui/material/Typography";
import Divider            from "@mui/material/Divider";
import Alert              from "@mui/material/Alert";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import LockOutlinedIcon   from "@mui/icons-material/LockOutlined";
import { Button }         from "@/components/ui";
import { useAuthStore }   from "@/store";

/**
 * LoginPage — authentication entry point.
 *
 * DEV MODE (this Technical Test):
 *   Uses a hardcoded dev token so the demo works without a real auth server.
 *   The token is signed with RS256 and includes customers:read + customers:write scopes.
 *   Resource servers in @Profile("dev") = permitAll, so no actual validation happens.
 *   This demonstrates the auth flow without the infrastructure dependency.
 *
 * PRODUCTION (Next.js BFF):
 *   The "Sign in" button would redirect to /api/auth/signin (NextAuth.js).
 *   NextAuth performs Authorization Code + PKCE with the real auth server.
 *   On success, it sets an HttpOnly session cookie — JS never sees the JWT.
 *   The browser is redirected back to the app and ProtectedRoute passes.
 *   No token is stored in Zustand — the Next.js server holds it.
 *
 * PRODUCTION (resource server direct, no BFF):
 *   The "Sign in" button redirects to the auth server login page.
 *   Auth server redirects back with an authorization code.
 *   Frontend exchanges code for token (Authorization Code + PKCE).
 *   Token stored in memory (Zustand, no persist) — short-lived access token.
 *   Refresh token in HttpOnly cookie set by auth server.
 */

// Hardcoded dev JWT — valid structure, no real signature validation in dev profile
// In prod this would NEVER exist in frontend code
const DEV_TOKEN = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkZXYtdXNlciIsInNjb3BlIjoiY3VzdG9tZXJzOnJlYWQgY3VzdG9tZXJzOndyaXRlIiwiaWF0IjoxNzA5MDAwMDAwLCJleHAiOjk5OTk5OTk5OTksImlzcyI6Imh0dHA6Ly9sb2NhbGhvc3Q6OTAwMCJ9.dev-signature";

export function LoginPage() {
  const { login, isAuthed } = useAuthStore();
  const navigate            = useNavigate();
  const location            = useLocation();

  // If already authenticated, redirect to intended destination
  const from = location.state?.from?.pathname ?? "/";
  useEffect(() => {
    if (isAuthed) navigate(from, { replace: true });
  }, [isAuthed, navigate, from]);

  const handleDevLogin = () => {
    login(DEV_TOKEN);
    navigate(from, { replace: true });
  };

  return (
    <Box sx={{
      minHeight:      "100vh",
      display:        "flex",
      alignItems:     "center",
      justifyContent: "center",
      bgcolor:        "background.default",
      p:              2,
    }}>
      <Paper sx={{ maxWidth: 400, width: "100%", p: 4 }}>

        {/* Brand */}
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 3 }}>
          <Box sx={{
            width: 56, height: 56, borderRadius: "50%",
            bgcolor: "primary.light", display: "flex",
            alignItems: "center", justifyContent: "center", mb: 2,
          }}>
            <AccountBalanceIcon sx={{ color: "primary.main", fontSize: 28 }} />
          </Box>
          <Typography variant="h5" fontWeight={600}>Allica Test</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Customer Management
          </Typography>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Dev mode notice */}
        <Alert severity="info" icon={<LockOutlinedIcon fontSize="small" />}
               sx={{ mb: 3, borderRadius: 1.5 }}>
          <Typography variant="body2" fontWeight={500} gutterBottom>
            Development mode
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Sign in with a hardcoded dev token. In production, this button
            triggers OAuth2 Authorization Code + PKCE via Next.js + NextAuth.js.
            The JWT is stored server-side — the browser receives only an HttpOnly
            session cookie.
          </Typography>
        </Alert>

        {/* Sign in button */}
        <Button
          fullWidth
          size="large"
          onClick={handleDevLogin}
          sx={{ py: 1.25 }}
        >
          Sign in (dev mode)
        </Button>

        {/* Production flow explanation */}
        <Box sx={{ mt: 3, p: 2, bgcolor: "grey.50", borderRadius: 1.5 }}>
          <Typography variant="overline" color="text.disabled" display="block" gutterBottom>
            Production flow
          </Typography>
          <Typography variant="caption" color="text.secondary" component="div" sx={{ lineHeight: 1.6 }}>
            1. Browser → <code>/api/auth/signin</code> (NextAuth.js route)
            <br />
            2. NextAuth → Auth Server (Authorization Code + PKCE)
            <br />
            3. Auth Server → NextAuth (access token + refresh token)
            <br />
            4. NextAuth → Browser (HttpOnly session cookie — no JWT visible)
            <br />
            5. Browser → Next.js API routes (cookie only)
            <br />
            6. Next.js → Spring Boot (Bearer token attached server-side)
          </Typography>
        </Box>

      </Paper>
    </Box>
  );
}
