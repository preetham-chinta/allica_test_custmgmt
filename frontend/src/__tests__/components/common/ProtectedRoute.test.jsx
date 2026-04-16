import { screen }             from "@testing-library/react";
import { renderWithProviders } from "../../test-utils";
import { ProtectedRoute }     from "@/components/common/ProtectedRoute";
import { useAuthStore }        from "@/store";

function DummyPage() { return <div>Protected content</div>; }

describe("ProtectedRoute", () => {
  beforeEach(() => {
    useAuthStore.setState({ token: null, isAuthed: false });
    sessionStorage.clear();
  });

  it("renders children when authenticated", () => {
    useAuthStore.setState({ token: "valid-token", isAuthed: true });
    renderWithProviders(
      <ProtectedRoute><DummyPage /></ProtectedRoute>
    );
    expect(screen.getByText("Protected content")).toBeInTheDocument();
  });

  it("does not render protected content when unauthenticated", () => {
    renderWithProviders(
      <ProtectedRoute><DummyPage /></ProtectedRoute>
    );
    expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
  });
});
