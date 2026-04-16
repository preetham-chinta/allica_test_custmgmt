import { create }                     from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/**
 * useAuthStore — authentication state.
 *
 * Stores the JWT access token in sessionStorage via Zustand persist.
 * sessionStorage clears on tab close — appropriate for short-lived tokens.
 *
 * Why sessionStorage and not localStorage?
 *   - localStorage persists across browser restarts — too long for a JWT
 *   - sessionStorage clears when the tab closes — matches token lifetime
 *   - Neither is HttpOnly — XSS can read both (this is the tradeoff)
 *
 * In production (Next.js BFF):
 *   - Next.js server holds the JWT in an encrypted server-side session
 *   - Browser gets an HttpOnly cookie — JS cannot read it
 *   - tokenStore.js is not needed — Next.js handles auth transparently
 *   - This in-memory approach is correct for a POC demo without Next.js
 *
 * Non-React access (HttpClient):
 *   useAuthStore.getState().token — same pattern as CustomerService
 *   reading useBackendStore.getState(). Consistent across the codebase.
 */
export const useAuthStore = create(
  persist(
    (set) => ({
      token:    null,   // JWT access token — null when not authenticated
      isAuthed: false,

      login:  (token) => set({ token, isAuthed: true }),
      logout: ()      => set({ token: null, isAuthed: false }),
    }),
    {
      name:    "allica-auth",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);

/**
 * useBackendStore — backend and API version selection.
 *
 * Zustand exposes .getState() for non-React code (CustomerService).
 * TanStack Query refetches automatically when queryKey includes backend/version.
 */
export const useBackendStore = create(
  persist(
    (set) => ({
      backend: process.env.ACTIVE_BACKEND || "mvc",
      version: "v1",
      setBackend: (backend) => set({ backend }),
      setVersion: (version) => set({ version }),
    }),
    { name: "allica-backend", storage: createJSONStorage(() => sessionStorage) }
  )
);

/**
 * useSearchHistoryStore — recent search queries.
 * Cleared when the tab closes (sessionStorage).
 */
export const useSearchHistoryStore = create(
  persist(
    (set) => ({
      history: [],
      add:   (q) => set(s => ({
        history: [q, ...s.history.filter(h => h !== q)].slice(0, 6),
      })),
      clear: () => set({ history: [] }),
    }),
    { name: "allica-search-history", storage: createJSONStorage(() => sessionStorage) }
  )
);
