/**
 * @file use-city-search.ts
 * @description Hook managing debounced geocoding search state, instant Indian suggestions,
 * and keyboard navigation for city search.
 */

import { useState, useEffect } from "react";
import { LocationResult } from "@/schemas/geo";
import { matchIndianCities } from "@/data/indian-cities";

async function fetchGeoResults(trimmed: string): Promise<LocationResult[]> {
  try {
    const res = await fetch(`/api/geo/search?q=${encodeURIComponent(trimmed)}`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data)
      ? data
      : Array.isArray(data?.results)
        ? data.results
        : [];
  } catch {
    return [];
  }
}

export function useCitySearch(onSelectLocation: (loc: LocationResult) => void) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<LocationResult[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setIsOpen(false);
      setActiveIndex(-1);
      setIsLoading(false);
      return;
    }

    const instantMatches = matchIndianCities(trimmed, 5);
    setResults(instantMatches);
    setIsOpen(instantMatches.length > 0);
    setActiveIndex(-1);

    if (trimmed.length < 2) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(async () => {
      const items = await fetchGeoResults(trimmed);
      if (items.length > 0) {
        setResults(items.slice(0, 5));
        setIsOpen(true);
      } else if (instantMatches.length === 0) {
        setResults([]);
        setIsOpen(true);
      }
      setIsLoading(false);
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (loc: LocationResult) => {
    onSelectLocation(loc);
    setQuery("");
    setResults([]);
    setIsOpen(false);
    setActiveIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev <= 0 ? results.length - 1 : prev - 1));
    } else if (e.key === "Enter" && activeIndex >= 0 && results[activeIndex]) {
      e.preventDefault();
      handleSelect(results[activeIndex]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return {
    query,
    setQuery,
    results,
    activeIndex,
    isLoading,
    isOpen,
    setIsOpen,
    handleSelect,
    handleKeyDown,
    clearSearch: () => {
      setQuery("");
      setResults([]);
      setIsOpen(false);
    },
  };
}
