import { render }                           from "@testing-library/react";
import { MemoryRouter }                     from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider }                    from "@mui/material/styles";
import CssBaseline                          from "@mui/material/CssBaseline";
import { theme }                            from "@/components/ui";

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries:   { retry: false, staleTime: 0, gcTime: 0 },
      mutations: { retry: false },
    },
    logger: { log: () => {}, warn: () => {}, error: () => {} },
  });
}

/**
 * renderWithProviders — wraps with MUI ThemeProvider + QueryClient + MemoryRouter.
 * All three are needed for components that use MUI, TanStack Query, and React Router.
 */
export function renderWithProviders(ui, options = {}) {
  const { initialRoute = "/", queryClient = createTestQueryClient(), ...rest } = options;
  function Wrapper({ children }) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={[initialRoute]}>
            {children}
          </MemoryRouter>
        </QueryClientProvider>
      </ThemeProvider>
    );
  }
  return { queryClient, ...render(ui, { wrapper: Wrapper, ...rest }) };
}

export function createHookWrapper(options = {}) {
  const { initialRoute = "/", queryClient = createTestQueryClient() } = options;
  return function Wrapper({ children }) {
    return (
      <ThemeProvider theme={theme}>
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={[initialRoute]}>
            {children}
          </MemoryRouter>
        </QueryClientProvider>
      </ThemeProvider>
    );
  };
}
