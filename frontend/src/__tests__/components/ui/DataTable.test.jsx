import { render, screen } from "@testing-library/react";
import userEvent           from "@testing-library/user-event";
import { DataTable }      from "@/components/ui";

const columns = [
  { field: "name",   header: "Name",   sortable: true  },
  { field: "email",  header: "Email",  sortable: false },
  { field: "status", header: "Status", sortable: false,
    render: (row) => <span data-testid="status">{row.status}</span> },
];

const rows = [
  { id: 1, name: "Alice Smith", email: "alice@example.com", status: "ACTIVE"   },
  { id: 2, name: "Bob Jones",   email: "bob@example.com",   status: "INACTIVE" },
];

describe("DataTable", () => {
  it("renders column headers", () => {
    render(<DataTable columns={columns} rows={rows} />);
    expect(screen.getByRole("columnheader", { name: /name/i })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /email/i })).toBeInTheDocument();
  });

  it("renders all data rows", () => {
    render(<DataTable columns={columns} rows={rows} />);
    expect(screen.getByText("Alice Smith")).toBeInTheDocument();
    expect(screen.getByText("Bob Jones")).toBeInTheDocument();
  });

  it("uses custom render function for cells", () => {
    render(<DataTable columns={columns} rows={rows} />);
    expect(screen.getAllByTestId("status")[0]).toHaveTextContent("ACTIVE");
  });

  it("shows skeleton rows when loading", () => {
    const { container } = render(<DataTable columns={columns} rows={[]} loading />);
    expect(container.querySelectorAll("tr[aria-hidden='true']").length).toBeGreaterThan(0);
  });

  it("shows empty message when no rows", () => {
    render(<DataTable columns={columns} rows={[]} emptyMessage="No records found." />);
    expect(screen.getByText("No records found.")).toBeInTheDocument();
  });

  it("calls onSort with toggled direction on sortable header click", async () => {
    const onSort = jest.fn();
    const user = userEvent.setup();
    render(<DataTable columns={columns} rows={rows} onSort={onSort} sortField="name" sortDir="asc" />);
    await user.click(screen.getByRole("button", { name: /name/i }));
    expect(onSort).toHaveBeenCalledWith("name", "desc");
  });

  it("shows row count in footer", () => {
    render(<DataTable columns={columns} rows={rows} />);
    expect(screen.getByText(/2 records/i)).toBeInTheDocument();
  });

  it("has accessible table label", () => {
    render(<DataTable columns={columns} rows={rows} aria-label="Customer list" />);
    expect(screen.getByRole("table", { name: /customer list/i })).toBeInTheDocument();
  });

  it("aria-busy true when loading", () => {
    render(<DataTable columns={columns} rows={[]} loading />);
    expect(screen.getByRole("table")).toHaveAttribute("aria-busy", "true");
  });
});
