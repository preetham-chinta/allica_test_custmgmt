import { useState }         from "react";
import Box                  from "@mui/material/Box";
import Typography           from "@mui/material/Typography";
import Collapse             from "@mui/material/Collapse";
import Alert                from "@mui/material/Alert";
import { Button }           from "@/components/ui";
import { PageSection }      from "@/components/layout/PageSection";
import { CustomerForm }     from "@/components/customer/CustomerForm";
import { CustomerList }     from "@/components/customer/CustomerList";
import { ErrorBoundary }    from "@/components/common/ErrorBoundary";

/**
 * CustomersPage — single-page layout.
 *
 * Two sections:
 *   1. Add customer — collapsible form
 *   2. Customers    — SearchField above DataTable with infinite scroll
 *
 * ErrorBoundary wraps CustomerList only.
 * If the list crashes (malformed data, unexpected null), the form above
 * stays functional — users can still add customers.
 *
 * Success banner auto-dismisses after 4 seconds.
 */
export function CustomersPage() {
  const [formOpen,   setFormOpen]   = useState(true);
  const [successMsg, setSuccessMsg] = useState(null);

  const handleSuccess = (customer) => {
    setSuccessMsg(`${customer.firstName} ${customer.lastName} added successfully.`);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>

      {/* ── Page title ──────────────────────────────────────────────── */}
      <Box>
        <Typography variant="h5" component="h1" gutterBottom>
          Customer Management
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Allica Bank — Technical Assessment
        </Typography>
      </Box>

      {/* ── Add customer ─────────────────────────────────────────────── */}
      <PageSection
        id="add-customer"
        title="Add customer"
        action={
          <Button
            variant="text"
            color="inherit"
            size="small"
            onClick={() => setFormOpen((o) => !o)}
            aria-expanded={formOpen}
            sx={{ color: "text.secondary", fontSize: "0.8125rem" }}
          >
            {formOpen ? "Collapse ↑" : "Expand ↓"}
          </Button>
        }
      >
        {/* Success banner */}
        <Collapse in={!!successMsg} unmountOnExit>
          <Alert
            severity="success"
            role="status"
            aria-live="polite"
            sx={{ mb: 2, borderRadius: 1.5 }}
            onClose={() => setSuccessMsg(null)}
          >
            {successMsg}
          </Alert>
        </Collapse>

        {/* Collapsible form */}
        <Collapse in={formOpen} unmountOnExit>
          <CustomerForm onSuccess={handleSuccess} />
        </Collapse>
      </PageSection>

      {/* ── Customer list + search ───────────────────────────────────── */}
      <PageSection
        id="customer-list"
        title="Customers"
        subtitle="Search, sort, and browse all customers"
      >
        <ErrorBoundary
          fallbackTitle="Customer list unavailable"
          fallbackMessage="The customer list encountered an error. You can still add customers using the form above."
        >
          <CustomerList />
        </ErrorBoundary>
      </PageSection>

    </Box>
  );
}
