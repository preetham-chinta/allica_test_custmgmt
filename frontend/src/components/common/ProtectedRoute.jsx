import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore }           from "@/store";

/**
 * ProtectedRoute — guards routes that require authentication.
 *
 * Reads auth state from Zustand (isAuthed).
 * Unauthenticated → redirect to /login, preserving the intended destination
 * so the user lands back on it after signing in.
 *
 * In production (Next.js BFF):
 *   This component would check whether the Next.js session is valid,
 *   typically via a GET /api/auth/session call. The redirect to /login
 *   would instead trigger the OAuth2 Authorization Code flow.
 *
 * In this POC:
 *   isAuthed is true when a token has been set in the store.
 *   The dev login page sets a hardcoded token so the demo works
 *   without a real auth server running.
 */
export function ProtectedRoute({ children }) {
  const { isAuthed } = useAuthStore();
  const location     = useLocation();

  if (!isAuthed) {
    return (
      <Navigate
        to="/login"
        state={{ from: location }}  // preserved for post-login redirect
        replace
      />
    );
  }

  return children;
}
