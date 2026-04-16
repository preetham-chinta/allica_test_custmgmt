import { useState, useCallback, useRef, useEffect, useDeferredValue } from "react";
import { customerService }         from "@/services/CustomerService";
import { useServiceQuery }         from "@/lib/queryHooks";
import { queryKeys }               from "@/lib/queryClient";
import { useSearchHistoryStore }   from "@/store";
import { API_DEFAULTS }            from "@/constants/ApiEndpoints";

/**
 * useCustomerSearch — owns the search input state and suggestions.
 *
 * Composed with useCustomers in CustomerList:
 *   useCustomerSearch → owns input value, debounce, committedQuery
 *   useCustomers(committedQuery) → owns the infinite query + data
 *
 * useDeferredValue:
 *   React 18 concurrent feature. deferredQuery updates in a lower-priority
 *   render than committedQuery — the input stays responsive at 60fps while
 *   the results list updates in the background.
 *
 *   isStale = committedQuery !== deferredQuery
 *   → true while React is preparing the next render
 *   → CustomerList dims the card list slightly during the transition
 *   → no blank screen, no layout shift — old results shown until new arrive
 *
 * Suggestions:
 *   Always use V2 endpoint (suggest only exists on V2).
 *   3-second timeout — stale suggestions are useless.
 *   Disabled when input is below MIN_QUERY_LENGTH or dropdown is closed.
 */
export function useCustomerSearch() {
  const [inputValue,     setInputValue]     = useState("");
  const [committedQuery, setCommittedQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef(null);
  const inputRef    = useRef(null);
  const { add: addHistory, history } = useSearchHistoryStore();

  // useDeferredValue — non-blocking search
  const deferredQuery = useDeferredValue(committedQuery);
  const isStale       = committedQuery !== deferredQuery;

  const setQuery = useCallback((value) => {
    setInputValue(value);
    setShowSuggestions(value.length >= API_DEFAULTS.MIN_QUERY_LENGTH);
    clearTimeout(debounceRef.current);

    if (!value) {
      setCommittedQuery("");
      return;
    }

    debounceRef.current = setTimeout(() => {
      if (value.length >= API_DEFAULTS.MIN_QUERY_LENGTH) {
        setCommittedQuery(value);
        addHistory(value);
      }
    }, API_DEFAULTS.DEBOUNCE_MS);
  }, [addHistory]);

  const clear = useCallback(() => {
    clearTimeout(debounceRef.current);
    setInputValue("");
    setCommittedQuery("");
    setShowSuggestions(false);
    inputRef.current?.focus();
  }, []);

  const selectSuggestion = useCallback((s) => {
    clearTimeout(debounceRef.current);
    setInputValue(s);
    setCommittedQuery(s);
    setShowSuggestions(false);
    addHistory(s);
    inputRef.current?.focus();
  }, [addHistory]);

  useEffect(() => () => clearTimeout(debounceRef.current), []);

  // Suggestions query — disabled when not needed
  const { data: suggestions = [] } = useServiceQuery(
    queryKeys.customers.suggest(inputValue),
    (signal) => customerService.suggest(inputValue),
    {
      enabled:   inputValue.length >= API_DEFAULTS.MIN_QUERY_LENGTH && showSuggestions,
      staleTime: 60_000,
    }
  );

  return {
    // Input state
    inputValue,
    committedQuery,
    deferredQuery,   // pass to useCustomers — lower-priority update
    isStale,         // pass to CustomerList — dim cards during transition
    inputRef,

    // Suggestions
    suggestions,
    showSuggestions,

    // History
    history,

    // Actions
    setQuery,
    clear,
    selectSuggestion,
    setShowSuggestions,
  };
}
