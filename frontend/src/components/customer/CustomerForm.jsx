import { useForm }           from "react-hook-form";
import { zodResolver }       from "@hookform/resolvers/zod";
import { z }                 from "zod";
import Box                   from "@mui/material/Box";
import Grid                  from "@mui/material/Grid";
import TextField             from "@mui/material/TextField";
import Alert                 from "@mui/material/Alert";
import { Button }            from "@/components/ui";
import { useCreateCustomer } from "@/hooks/useCustomers";

const schema = z.object({
  firstName:   z.string().min(1, "First name is required").max(100),
  lastName:    z.string().min(1, "Last name is required").max(100),
  dateOfBirth: z.string().min(1, "Date of birth is required")
    .refine(
      (v) => !isNaN(new Date(v)) && new Date(v) < new Date(),
      "Date of birth must be in the past"
    ),
});

/**
 * CustomerForm — 3-column inline form using MUI Grid + TextField.
 *
 * MUI TextField gives us: floating label, error/helperText, consistent
 * focus ring, and dark-mode support — all from theme.js, zero inline styles.
 *
 * Error surfaces:
 *   Field-level  → helperText prop (Zod validation messages)
 *   Form-level   → Alert below fields (409 Conflict, server errors)
 */
export function CustomerForm({ onSuccess, onCancel }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    reset,
  } = useForm({ resolver: zodResolver(schema) });

  const { mutate } = useCreateCustomer({
    onSuccess: (customer) => { reset(); onSuccess?.(customer); },
    onError:   (err) => setError("root", {
      message: err.status === 409
        ? "A customer with this name and date of birth already exists."
        : err.userMessage ?? err.message ?? "An unexpected error occurred.",
    }),
  });

  return (
    <Box component="form" onSubmit={handleSubmit((d) => mutate(d))}
         noValidate aria-label="Create customer">

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={4}>
          <TextField
            id="firstName" label="First name"
            autoComplete="given-name" placeholder="e.g. Alice"
            error={!!errors.firstName} helperText={errors.firstName?.message}
            inputProps={{ "aria-invalid": !!errors.firstName }}
            {...register("firstName")}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            id="lastName" label="Last name"
            autoComplete="family-name" placeholder="e.g. Smith"
            error={!!errors.lastName} helperText={errors.lastName?.message}
            inputProps={{ "aria-invalid": !!errors.lastName }}
            {...register("lastName")}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            id="dateOfBirth" label="Date of birth" type="date"
            InputLabelProps={{ shrink: true }}
            inputProps={{
              max: new Date().toISOString().split("T")[0],
              "aria-invalid": !!errors.dateOfBirth,
            }}
            error={!!errors.dateOfBirth} helperText={errors.dateOfBirth?.message}
            {...register("dateOfBirth")}
          />
        </Grid>
      </Grid>

      {errors.root && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 1.5 }}>
          {errors.root.message}
        </Alert>
      )}

      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
        {onCancel && (
          <Button variant="outlined" color="inherit"
                  onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        )}
        <Button type="submit" loading={isSubmitting}>
          Add customer
        </Button>
      </Box>
    </Box>
  );
}
