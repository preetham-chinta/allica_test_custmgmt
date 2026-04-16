import { useRef, useEffect, useCallback } from "react";

/**
 * useInfiniteScroll — IntersectionObserver-based infinite scroll hook.
 *
 * Usage:
 *   const sentinelRef = useInfiniteScroll(fetchNextPage, hasNextPage);
 *   <div ref={sentinelRef} />   ← place at the bottom of your list
 *
 * When the sentinel element enters the viewport, fetchNextPage is called.
 * Observer disconnects automatically if hasNextPage is false.
 *
 * Why IntersectionObserver over scroll events:
 * - No scroll listener needed — browser calls back on intersection
 * - Works with any scroll container, not just window
 * - Fires off the main thread — doesn't block rendering
 */
export function useInfiniteScroll(fetchNextPage, hasNextPage, options = {}) {
  const sentinelRef = useRef(null);
  const { threshold = 0.1, rootMargin = "100px" } = options;

  const handleIntersection = useCallback(
    (entries) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasNextPage) {
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage]
  );

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(handleIntersection, {
      threshold,
      rootMargin,
    });

    observer.observe(sentinel);

    // Cleanup: disconnect when component unmounts or deps change
    return () => observer.disconnect();
  }, [handleIntersection, threshold, rootMargin]);

  return sentinelRef;
}
