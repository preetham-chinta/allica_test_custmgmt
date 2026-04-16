import { Component } from "react";
import Alert         from "@mui/material/Alert";
import AlertTitle    from "@mui/material/AlertTitle";
import MuiButton     from "@mui/material/Button";
import Box           from "@mui/material/Box";

/**
 * ErrorBoundary — React class component.
 *
 * Must be a class — getDerivedStateFromError is a class-only lifecycle.
 * Wraps CustomerList so a rendering crash doesn't take down the form.
 *
 * Uses MUI Alert directly here (not via ui/ wrapper) because ErrorBoundary
 * must never depend on a component that could itself throw.
 * Alert is a stable MUI primitive with no custom logic.
 */
export class ErrorBoundary extends Component {
  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message ?? "Unknown error" };
  }

  constructor(props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <Alert
        severity="error"
        sx={{ borderRadius: 1.5 }}
        action={
          <MuiButton
            color="error"
            size="small"
            onClick={() => {
              this.setState({ hasError: false });
              this.props.onReset?.();
            }}
            sx={{ textTransform: "none" }}
          >
            Try again
          </MuiButton>
        }
      >
        <AlertTitle sx={{ fontWeight: 600 }}>
          {this.props.fallbackTitle ?? "Something went wrong"}
        </AlertTitle>
        {this.props.fallbackMessage ?? this.state.message}
      </Alert>
    );
  }
}
