/**
 * @file city-search.tsx
 * @description Accessible location geocoding search input with debounce and results dropdown.
 * Addresses problem-statement: Location, City search through geocoding, privacy rounding.
 */

"use client";

import React, { useState, useEffect, useRef } from "react";
import { LocationResult } from "@/schemas/geo";
import { Input } from "@/components/ui/input";
import { Icon } from "@/components/ui/icon";

export interface CitySearchProps {
  onSelectLocation: (loc: LocationResult) => void;
  className?: string;
}

function SearchDropdown({
  results,
  onSelect,
}: {
  results: LocationResult[];
  onSelect: (loc: LocationResult) => void;
}) {
  return (
    <ul
      role="listbox"
      aria-label="City search results"
      className="absolute z-40 left-0 right-0 mt-1 max-h-60 overflow-y-auto rounded-xl bg-slate-900 border border-slate-700 shadow-2xl py-1 divide-y divide-slate-800"
    >
      {results.map((loc) => (
        <li
          key={loc.id}
          role="option"
          aria-selected={false}
          onClick={() => onSelect(loc)}
          className="px-4 py-2.5 text-sm cursor-pointer hover:bg-slate-800 transition-colors flex items-center justify-between"
        >
          <div>
            <p className="font-semibold text-slate-100">{loc.name}</p>
            <p className="text-xs text-slate-400">
              {[loc.admin1, loc.country].filter(Boolean).join(", ")}
            </p>
          </div>
          <span className="text-2xs text-slate-500 tabular-nums">
            {loc.latitude.toFixed(2)}, {loc.longitude.toFixed(2)}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function CitySearch({ onSelectLocation, className = "" }: CitySearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<LocationResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/geo/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(Array.isArray(data.results) ? data.results : []);
          setIsOpen(true);
        }
      } catch {
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (loc: LocationResult) => {
    onSelectLocation(loc);
    setQuery("");
    setIsOpen(false);
  };

  return (
    <div ref={searchRef} className={`relative w-full ${className}`}>
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setIsOpen(true)}
        placeholder="Search city (e.g. Delhi, Kolkata, Lahore)..."
        aria-label="Search city or location"
        leftAddon={<Icon name="search" size={16} />}
        rightAddon={
          isLoading ? <Icon name="refresh" size={16} className="animate-spin text-sky-400" /> : undefined
        }
      />
      {isOpen && results.length > 0 && (
        <SearchDropdown results={results} onSelect={handleSelect} />
      )}
    </div>
  );
}
