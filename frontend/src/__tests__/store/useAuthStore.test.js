import { useAuthStore } from "@/store";

/**
 * useAuthStore tests — verify the auth state machine.
 *
 * Key things to test:
 *   - Initial state is unauthenticated
 *   - login() sets token and isAuthed flag
 *   - logout() clears token and isAuthed flag
 *   - getState() works outside React (used by HttpClient)
 */
describe("useAuthStore", () => {

  beforeEach(() => {
    // Reset store to initial state between tests
    useAuthStore.setState({ token: null, isAuthed: false });
    sessionStorage.clear();
  });

  it("starts unauthenticated with no token", () => {
    const { token, isAuthed } = useAuthStore.getState();
    expect(token).toBeNull();
    expect(isAuthed).toBe(false);
  });

  it("login() sets token and marks as authenticated", () => {
    useAuthStore.getState().login("test-jwt-token");
    const { token, isAuthed } = useAuthStore.getState();
    expect(token).toBe("test-jwt-token");
    expect(isAuthed).toBe(true);
  });

  it("logout() clears token and marks as unauthenticated", () => {
    useAuthStore.getState().login("test-jwt-token");
    useAuthStore.getState().logout();
    const { token, isAuthed } = useAuthStore.getState();
    expect(token).toBeNull();
    expect(isAuthed).toBe(false);
  });

  it("getState() works outside React component tree", () => {
    // This is how HttpClient reads the token — no hook, no subscription
    useAuthStore.getState().login("direct-read-token");
    const token = useAuthStore.getState().token;
    expect(token).toBe("direct-read-token");
  });

  it("logout after login returns to initial state", () => {
    useAuthStore.getState().login("token-123");
    useAuthStore.getState().logout();
    expect(useAuthStore.getState().token).toBeNull();
    expect(useAuthStore.getState().isAuthed).toBe(false);
  });
});
