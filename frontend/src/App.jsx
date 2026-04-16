import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClientProvider }                     from "@tanstack/react-query";
import { ThemeProvider, CssBaseline }              from "@mui/material";
import { queryClient }       from "@/lib/queryClient";
import { theme }             from "@/components/ui";
import { AppHeader }         from "@/components/layout/AppHeader";
import { AppFooter }         from "@/components/layout/AppFooter";
import { ProtectedRoute }    from "@/components/common/ProtectedRoute";
import { CustomersPage }     from "@/pages/CustomersPage";
import { LoginPage }         from "@/pages/LoginPage";

/**
 * App — root component.
 *
 * Route structure:
 *   /login      → LoginPage (public — no auth required)
 *   /           → CustomersPage (protected — requires isAuthed in Zustand)
 *   *           → redirect to /
 *
 * ProtectedRoute reads useAuthStore().isAuthed.
 * Unauthenticated users are redirected to /login with the intended path
 * preserved in location.state.from, so they land back after signing in.
 *
 * ThemeProvider + CssBaseline: MUI theme applied globally.
 * All child components inherit palette, typography, and component overrides
 * from theme.js — no inline styles needed in components.
 */
export function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected — all wrapped in AppHeader + AppFooter shell */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <div className="app-shell">
                    <AppHeader />
                    <main className="app-main" id="main-content">
                      <div className="content-wrapper">
                        <CustomersPage />
                      </div>
                    </main>
                    <AppFooter />
                  </div>
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
