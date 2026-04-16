import { render, screen } from "@testing-library/react";
import { CustomerCard }   from "@/components/customer/CustomerCard";

const customer = {
  id: 1, firstName: "Alice", lastName: "Smith",
  dateOfBirth: "1985-03-10", status: "ACTIVE",
  createdAt: "2026-01-01T10:00:00",
};

describe("CustomerCard", () => {
  it("renders customer full name", () => {
    render(<CustomerCard customer={customer} />);
    expect(screen.getByText(/Alice/)).toBeInTheDocument();
    expect(screen.getByText(/Smith/)).toBeInTheDocument();
  });

  it("renders MUI Avatar with initials", () => {
    render(<CustomerCard customer={customer} />);
    expect(screen.getByText("AS")).toBeInTheDocument();
  });

  it("shows saving indicator when optimistic", () => {
    render(<CustomerCard customer={{ ...customer, _optimistic: true }} />);
    expect(screen.getByText(/saving/i)).toBeInTheDocument();
  });

  it("highlights matching text with mark element", () => {
    render(<CustomerCard customer={customer} highlight="Ali" />);
    expect(document.querySelector("mark")).toBeInTheDocument();
    expect(document.querySelector("mark").textContent).toBe("Ali");
  });

  it("does not highlight for single character query", () => {
    render(<CustomerCard customer={customer} highlight="A" />);
    expect(document.querySelector("mark")).not.toBeInTheDocument();
  });

  it("handles missing status gracefully", () => {
    render(<CustomerCard customer={{ ...customer, status: undefined }} />);
    expect(screen.getByText("AS")).toBeInTheDocument();
  });
});
