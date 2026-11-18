/**
 * @file city-search.tsx
 * @description Accessible location geocoding search input with instant as-you-type suggestions,
 * Indian region priority, and up to 5 matching places.
 * Addresses problem-statement: Location, City search through geocoding, privacy rounding.
 */

"use client";

import React, { useEffect, useRef } from "react";
import { LocationResult } from "@/schemas/geo";
import { Input } from "@/components/ui/input";
import { Icon } from "@/components/ui/icon";
import { useCitySearch } from "./use-city-search";

export interface CitySearchProps {
  onSelectLocation: (loc: LocationResult) => void;
  className?: string;
}

function SearchDropdownItem({
  loc,
  isActive,
  onSelect,
}: {
  loc: LocationResult;
  isActive: boolean;
  onSelect: (loc: LocationResult) => void;
}) {
  const isIndia = loc.country.toLowerCase() === "india" || loc.timezone === "Asia/Kolkata";
  const regionLabel = [loc.admin1, loc.country].filter(Boolean).join(", ");

  return (
    <li
      id={`city-opt-${loc.id}`}
      role="option"
      aria-selected={isActive}
      onClick={() => onSelect(loc)}
      style={{
        backgroundColor: isActive ? "var(--accent-soft)" : undefined,
      }}
      className="px-3.5 py-2.5 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex items-center justify-between gap-3 text-left"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <span style={{ color: isIndia ? "var(--accent)" : "var(--text-muted)" }} className="shrink-0">
          <Icon name="map-pin" size={14} />
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-xs truncate" style={{ color: "var(--text-primary)" }}>
              {loc.name}
            </span>
            {isIndia && (
              <span
                style={{
                  backgroundColor: "var(--accent-soft)",
                  color: "var(--accent)",
                }}
                className="text-3xs font-semibold px-1.5 py-0.5 rounded-sm shrink-0"
              >
                India
              </span>
            )}
          </div>
          <p className="text-2xs truncate" style={{ color: "var(--text-secondary)" }}>
            {regionLabel}
          </p>
        </div>
      </div>
      <span className="text-2xs tabular-nums shrink-0" style={{ color: "var(--text-muted)" }}>
        {loc.latitude.toFixed(2)}, {loc.longitude.toFixed(2)}
      </span>
    </li>
  );
}

function SearchDropdown({
  results,
  activeIndex,
  onSelect,
}: {
  results: LocationResult[];
  activeIndex: number;
  onSelect: (loc: LocationResult) => void;
}) {
  return (
    <ul
      id="city-search-results"
      role="listbox"
      aria-label="City suggestions"
      style={{
        backgroundColor: "var(--bg-surface)",
        borderColor: "var(--border-subtle)",
      }}
      className="absolute z-40 left-0 right-0 mt-1.5 max-h-72 overflow-y-auto rounded-xl border shadow-xl py-1 divide-y divide-subtle"
    >
      {results.map((loc, idx) => (
        <SearchDropdownItem
          key={`${loc.id}-${loc.latitude}-${loc.longitude}`}
          loc={loc}
          isActive={idx === activeIndex}
          onSelect={onSelect}
        />
      ))}
    </ul>
  );
}

function SearchAddons({
  isLoading,
  hasQuery,
  onClear,
}: {
  isLoading: boolean;
  hasQuery: boolean;
  onClear: () => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      {isLoading && <Icon name="refresh" size={14} className="animate-spin text-muted" />}
      {hasQuery && (
        <button
          type="button"
          onClick={onClear}
          className="text-muted hover:text-primary transition-colors cursor-pointer p-0.5"
          aria-label="Clear search input"
        >
          <Icon name="x" size={13} />
        </button>
      )}
    </div>
  );
}

export function CitySearch({ onSelectLocation, className = "" }: CitySearchProps) {
  const {
    query,
    setQuery,
    results,
    activeIndex,
    isLoading,
    isOpen,
    setIsOpen,
    handleSelect,
    handleKeyDown,
    clearSearch,
  } = useCitySearch(onSelectLocation);

  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setIsOpen]);

  return (
    <div ref={searchRef} className={`relative w-full ${className}`}>
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setIsOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder="Search city (e.g. Delhi, Mumbai, Pune, Kolkata)..."
        aria-label="Search city or location"
        role="combobox"
        aria-expanded={isOpen && results.length > 0}
        aria-controls="city-search-results"
        aria-autocomplete="list"
        leftAddon={<Icon name="search" size={16} />}
        rightAddon={
          <SearchAddons
            isLoading={isLoading}
            hasQuery={query.length > 0}
            onClear={clearSearch}
          />
        }
      />
      {isOpen && results.length > 0 && (
        <SearchDropdown
          results={results}
          activeIndex={activeIndex}
          onSelect={handleSelect}
        />
      )}
    </div>
  );
}
