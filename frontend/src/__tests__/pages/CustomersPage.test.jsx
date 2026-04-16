import { screen, waitFor }    from "@testing-library/react";
import userEvent               from "@testing-library/user-event";
import { http, HttpResponse }  from "msw";
import { server }              from "../msw/server";
import { renderWithProviders } from "../test-utils";
import { CustomersPage }       from "@/pages/CustomersPage";

describe("CustomersPage", () => {
  it("renders page heading", () => {
    renderWithProviders(<CustomersPage />);
    expect(screen.getByRole("heading", { name: /customer management/i })).toBeInTheDocument();
  });

  it("renders Add customer and Customers sections", () => {
    renderWithProviders(<CustomersPage />);
    expect(screen.getByRole("region", { name: /add customer/i })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /customer list/i })).toBeInTheDocument();
  });

  it("renders form fields", () => {
    renderWithProviders(<CustomersPage />);
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/date of birth/i)).toBeInTheDocument();
  });

  it("renders search field above table", () => {
    renderWithProviders(<CustomersPage />);
    expect(screen.getByRole("searchbox")).toBeInTheDocument();
  });

  it("shows customer data in table after loading", async () => {
    renderWithProviders(<CustomersPage />);
    await waitFor(() => expect(screen.getByText(/Alice/)).toBeInTheDocument());
  });

  it("shows MUI Alert success message after adding customer", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CustomersPage />);
    await user.type(screen.getByLabelText(/first name/i), "Eve");
    await user.type(screen.getByLabelText(/last name/i), "Thomas");
    await user.type(screen.getByLabelText(/date of birth/i), "1992-04-22");
    await user.click(screen.getByRole("button", { name: /add customer/i }));
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(/eve thomas/i)
    );
  });

  it("collapses form when Collapse button clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CustomersPage />);
    await user.click(screen.getByRole("button", { name: /collapse/i }));
    await waitFor(() =>
      expect(screen.queryByLabelText(/first name/i)).not.toBeInTheDocument()
    );
  });

  it("shows 409 conflict Alert on duplicate customer", async () => {
    server.use(
      http.post("/api/v1/customers", () =>
        HttpResponse.json({ status: 409, error: "Conflict", message: "Already exists" }, { status: 409 })
      )
    );
    const user = userEvent.setup();
    renderWithProviders(<CustomersPage />);
    await user.type(screen.getByLabelText(/first name/i), "Alice");
    await user.type(screen.getByLabelText(/last name/i), "Smith");
    await user.type(screen.getByLabelText(/date of birth/i), "1985-03-10");
    await user.click(screen.getByRole("button", { name: /add customer/i }));
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(/already exists/i)
    );
  });
});
