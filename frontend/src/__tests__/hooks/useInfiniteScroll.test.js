import { renderHook, act } from "@testing-library/react";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";

describe("useInfiniteScroll", () => {
  let observerCallback;
  let observeSpy, disconnectSpy;

  beforeEach(() => {
    observeSpy    = jest.fn();
    disconnectSpy = jest.fn();

    // Mock IntersectionObserver
    window.IntersectionObserver = jest.fn((cb) => {
      observerCallback = cb;
      return { observe: observeSpy, disconnect: disconnectSpy };
    });
  });

  it("returns a sentinel ref", () => {
    const { result } = renderHook(() =>
      useInfiniteScroll(jest.fn(), true)
    );
    expect(result.current).toBeDefined();
  });

  it("calls fetchNextPage when sentinel intersects and hasNextPage is true", () => {
    const fetchNextPage = jest.fn();
    renderHook(() => useInfiniteScroll(fetchNextPage, true));

    act(() => {
      observerCallback([{ isIntersecting: true }]);
    });

    expect(fetchNextPage).toHaveBeenCalledTimes(1);
  });

  it("does not call fetchNextPage when hasNextPage is false", () => {
    const fetchNextPage = jest.fn();
    renderHook(() => useInfiniteScroll(fetchNextPage, false));

    act(() => {
      observerCallback([{ isIntersecting: true }]);
    });

    expect(fetchNextPage).not.toHaveBeenCalled();
  });

  it("does not call fetchNextPage when sentinel is not intersecting", () => {
    const fetchNextPage = jest.fn();
    renderHook(() => useInfiniteScroll(fetchNextPage, true));

    act(() => {
      observerCallback([{ isIntersecting: false }]);
    });

    expect(fetchNextPage).not.toHaveBeenCalled();
  });

  it("disconnects observer on unmount", () => {
    const { unmount } = renderHook(() =>
      useInfiniteScroll(jest.fn(), true)
    );
    unmount();
    expect(disconnectSpy).toHaveBeenCalledTimes(1);
  });
});
