import { renderHook, act, waitFor } from "@testing-library/react";
import { http, HttpResponse }        from "msw";
import { server }                    from "../msw/server";
import { createHookWrapper }         from "../test-utils";
import { useCustomerSearch }         from "@/hooks/useCustomerSearch";

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

describe("useCustomerSearch", () => {
  it("starts with empty state", () => {
    const { result } = renderHook(() => useCustomerSearch(), {
      wrapper: createHookWrapper(),
    });
    expect(result.current.inputValue).toBe("");
    expect(result.current.committedQuery).toBe("");
    expect(result.current.suggestions).toHaveLength(0);
  });

  it("does not commit on single character", async () => {
    const { result } = renderHook(() => useCustomerSearch(), {
      wrapper: createHookWrapper(),
    });
    act(() => { result.current.setQuery("a"); });
    act(() => { jest.advanceTimersByTime(500); });
    expect(result.current.committedQuery).toBe("");
  });

  it("debounces 300ms before committing", async () => {
    const { result } = renderHook(() => useCustomerSearch(), {
      wrapper: createHookWrapper(),
    });
    act(() => { result.current.setQuery("alice"); });
    act(() => { jest.advanceTimersByTime(200); });
    expect(result.current.committedQuery).toBe("");
    act(() => { jest.advanceTimersByTime(150); });
    await waitFor(() => expect(result.current.committedQuery).toBe("alice"));
  });

  it("deferredQuery matches committedQuery after debounce", async () => {
    const { result } = renderHook(() => useCustomerSearch(), {
      wrapper: createHookWrapper(),
    });
    act(() => { result.current.setQuery("alice"); });
    act(() => { jest.advanceTimersByTime(300); });
    await waitFor(() => expect(result.current.committedQuery).toBe("alice"));
    // deferredQuery will eventually match committedQuery
    await waitFor(() => expect(result.current.deferredQuery).toBe("alice"));
  });

  it("isStale false when committedQuery matches deferredQuery", async () => {
    const { result } = renderHook(() => useCustomerSearch(), {
      wrapper: createHookWrapper(),
    });
    // Both empty initially — not stale
    expect(result.current.isStale).toBe(false);
  });

  it("clear() resets all state", async () => {
    const { result } = renderHook(() => useCustomerSearch(), {
      wrapper: createHookWrapper(),
    });
    act(() => { result.current.setQuery("alice"); });
    act(() => { jest.advanceTimersByTime(300); });
    await waitFor(() => expect(result.current.committedQuery).toBe("alice"));
    act(() => { result.current.clear(); });
    expect(result.current.inputValue).toBe("");
    expect(result.current.committedQuery).toBe("");
    expect(result.current.showSuggestions).toBe(false);
  });

  it("selectSuggestion commits immediately without debounce", async () => {
    const { result } = renderHook(() => useCustomerSearch(), {
      wrapper: createHookWrapper(),
    });
    act(() => { result.current.selectSuggestion("Alice"); });
    expect(result.current.inputValue).toBe("Alice");
    expect(result.current.committedQuery).toBe("Alice");
    expect(result.current.showSuggestions).toBe(false);
  });

  it("adds query to history after committing", async () => {
    const { result } = renderHook(() => useCustomerSearch(), {
      wrapper: createHookWrapper(),
    });
    act(() => { result.current.setQuery("alice"); });
    act(() => { jest.advanceTimersByTime(300); });
    await waitFor(() => expect(result.current.history).toContain("alice"));
  });

  it("handles search API error gracefully", async () => {
    server.use(
      http.get("/api/v2/customers/suggest", () => HttpResponse.error())
    );
    const { result } = renderHook(() => useCustomerSearch(), {
      wrapper: createHookWrapper(),
    });
    act(() => { result.current.setQuery("alice"); });
    // Suggestions fail but no crash — suggestions just empty
    await waitFor(() => expect(result.current.suggestions).toHaveLength(0));
  });
});
