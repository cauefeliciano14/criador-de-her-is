import { useState, useMemo, useCallback, useRef, useEffect } from "react";

export interface FilterConfig<T> {
  key: string;
  label: string;
  options: { value: string; label: string }[];
  match: (item: T, value: string) => boolean;
}

export interface ToggleFilterConfig<T> {
  key: string;
  label: string;
  match: (item: T) => boolean;
}

interface UseSearchAndFiltersConfig<T> {
  items: T[];
  searchFn: (item: T, query: string) => boolean;
  filters?: FilterConfig<T>[];
  toggleFilters?: ToggleFilterConfig<T>[];
  sortFn?: (a: T, b: T) => number;
  debounceMs?: number;
}

export function useSearchAndFilters<T>({
  items,
  searchFn,
  filters = [],
  toggleFilters = [],
  sortFn,
  debounceMs = 150,
}: UseSearchAndFiltersConfig<T>) {
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [activeToggles, setActiveToggles] = useState<Record<string, boolean>>({});
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  // Debounced search
  useEffect(() => {
    timerRef.current = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, debounceMs);
    return () => clearTimeout(timerRef.current);
  }, [searchInput, debounceMs]);

  const setFilter = useCallback((key: string, value: string | null) => {
    setActiveFilters((prev) => {
      if (value === null || value === "") {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return { ...prev, [key]: value };
    });
  }, []);

  const toggleFilter = useCallback((key: string) => {
    setActiveToggles((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const clearAll = useCallback(() => {
    setSearchInput("");
    setDebouncedSearch("");
    setActiveFilters({});
    setActiveToggles({});
  }, []);

  const hasActiveFilters = useMemo(
    () => debouncedSearch.length > 0 || Object.keys(activeFilters).length > 0 || Object.values(activeToggles).some(Boolean),
    [debouncedSearch, activeFilters, activeToggles]
  );

  const filtered = useMemo(() => {
    let result = items;

    // Search
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter((item) => searchFn(item, q));
    }

    // Filters
    for (const [key, value] of Object.entries(activeFilters)) {
      const config = filters.find((f) => f.key === key);
      if (config) {
        result = result.filter((item) => config.match(item, value));
      }
    }

    // Toggles
    for (const [key, active] of Object.entries(activeToggles)) {
      if (!active) continue;
      const config = toggleFilters.find((f) => f.key === key);
      if (config) {
        result = result.filter((item) => config.match(item));
      }
    }

    // Sort
    if (sortFn) {
      result = [...result].sort(sortFn);
    }

    return result;
  }, [items, debouncedSearch, activeFilters, activeToggles, searchFn, filters, toggleFilters, sortFn]);

  return {
    search: searchInput,
    setSearch: setSearchInput,
    filtered,
    activeFilters,
    activeToggles,
    setFilter,
    toggleFilter,
    clearAll,
    hasActiveFilters,
    resultCount: filtered.length,
    totalCount: items.length,
  };
}
