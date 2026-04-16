import { screen, waitFor }   from "@testing-library/react";
import userEvent              from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server }             from "../../msw/server";
import { renderWithProviders } from "../../test-utils";
import { CustomerForm }        from "@/components/customer/CustomerForm";

describe("CustomerForm", () => {
  it("renders First name, Last name, Date of birth fields", () => {
    renderWithProviders(<CustomerForm />);
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/date of birth/i)).toBeInTheDocument();
  });

  it("renders Add customer submit button", () => {
    renderWithProviders(<CustomerForm />);
    expect(screen.getByRole("button", { name: /add customer/i })).toBeInTheDocument();
  });

  it("shows helperText error for blank firstName on submit", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CustomerForm />);
    await user.click(screen.getByRole("button", { name: /add customer/i }));
    await waitFor(() =>
      expect(screen.getByText(/first name is required/i)).toBeInTheDocument()
    );
  });

  it("shows helperText error for future date of birth", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CustomerForm />);
    const future = new Date();
    future.setFullYear(future.getFullYear() + 1);
    await user.type(screen.getByLabelText(/first name/i), "Alice");
    await user.type(screen.getByLabelText(/last name/i), "Smith");
    await user.type(screen.getByLabelText(/date of birth/i), future.toISOString().split("T")[0]);
    await user.click(screen.getByRole("button", { name: /add customer/i }));
    await waitFor(() =>
      expect(screen.getByText(/must be in the past/i)).toBeInTheDocument()
    );
  });

  it("calls onSuccess and resets form after successful create", async () => {
    const onSuccess = jest.fn();
    const user = userEvent.setup();
    renderWithProviders(<CustomerForm onSuccess={onSuccess} />);
    await user.type(screen.getByLabelText(/first name/i), "Alice");
    await user.type(screen.getByLabelText(/last name/i), "Smith");
    await user.type(screen.getByLabelText(/date of birth/i), "1985-03-10");
    await user.click(screen.getByRole("button", { name: /add customer/i }));
    await waitFor(() =>
      expect(onSuccess).toHaveBeenCalledWith(
        expect.objectContaining({ firstName: "Alice" })
      )
    );
    expect(screen.getByLabelText(/first name/i)).toHaveValue("");
  });

  it("shows Alert for 409 duplicate customer", async () => {
    server.use(
      http.post("/api/v1/customers", () =>
        HttpResponse.json({ status: 409, error: "Conflict", message: "Already exists" }, { status: 409 })
      )
    );
    const user = userEvent.setup();
    renderWithProviders(<CustomerForm />);
    await user.type(screen.getByLabelText(/first name/i), "Alice");
    await user.type(screen.getByLabelText(/last name/i), "Smith");
    await user.type(screen.getByLabelText(/date of birth/i), "1985-03-10");
    await user.click(screen.getByRole("button", { name: /add customer/i }));
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(/already exists/i)
    );
  });

  it("button shows CircularProgress while submitting", async () => {
    server.use(
      http.post("/api/v1/customers", async () => {
        await new Promise(r => setTimeout(r, 300));
        return HttpResponse.json({ id: 1, firstName: "Alice", lastName: "Smith" }, { status: 201 });
      })
    );
    const user = userEvent.setup();
    renderWithProviders(<CustomerForm />);
    await user.type(screen.getByLabelText(/first name/i), "Alice");
    await user.type(screen.getByLabelText(/last name/i), "Smith");
    await user.type(screen.getByLabelText(/date of birth/i), "1985-03-10");
    await user.click(screen.getByRole("button", { name: /add customer/i }));
    // Button disabled while loading
    expect(screen.getByRole("button", { name: /add customer/i })).toBeDisabled();
  });

  it("renders Cancel button when onCancel provided", () => {
    renderWithProviders(<CustomerForm onCancel={jest.fn()} />);
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
  });

  it("calls onCancel when Cancel clicked", async () => {
    const onCancel = jest.fn();
    const user = userEvent.setup();
    renderWithProviders(<CustomerForm onCancel={onCancel} />);
    await user.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
