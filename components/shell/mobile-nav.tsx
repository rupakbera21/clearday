/**
 * @file mobile-nav.tsx
 * @description Mobile header, responsive tab strip, and keyboard-accessible navigation drawer with Escape dismissal.
 */

import React, { useEffect, useRef } from "react";
import { BrandLogo } from "./brand-logo";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { ThemeSwitcher } from "@/components/feature/theme-switcher";
import { NAV_DESTINATIONS, NavDestination } from "./nav-items";
import { AqiCategory } from "@/domain/aqi";

function MobileHeader({
  onOpen,
  locationLabel,
  aqiCategory,
}: {
  onOpen: () => void;
  locationLabel: string;
  aqiCategory: AqiCategory;
}) {
  return (
    <header
      style={{
        backgroundColor: "var(--bg-surface)",
        borderColor: "var(--border-subtle)",
      }}
      className="lg:hidden h-14 border-b px-3 sm:px-4 flex items-center justify-between sticky top-0 z-20 select-none w-full max-w-full"
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpen}
          aria-label="Open navigation menu"
          className="p-2 -ml-2 rounded-lg text-muted hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
        >
          <Icon name="menu" size={20} />
        </button>
        <BrandLogo width={110} height={32} className="h-7 w-auto object-contain" />
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        <Badge variant="aqi" aqiCategory={aqiCategory} className="hidden sm:inline-flex text-2xs px-2 py-0.5">
          {locationLabel}
        </Badge>
        <ThemeSwitcher />
      </div>
    </header>
  );
}

function MobileTabStrip({
  activeTab,
  onSelect,
}: {
  activeTab: string;
  onSelect: (id: string) => void;
}) {
  return (
    <nav
      aria-label="Mobile Destinations"
      style={{
        backgroundColor: "var(--bg-surface)",
        borderColor: "var(--border-subtle)",
      }}
      className="lg:hidden border-b px-2 py-1.5 flex items-center overflow-x-auto select-none w-full max-w-full"
    >
      <div role="tablist" aria-label="Mobile Navigation Tabs" className="flex items-center gap-1">
        {NAV_DESTINATIONS.map((dest) => {
          const isSelected = activeTab === dest.id;
          return (
            <button
              key={dest.id}
              role="tab"
              id={`tab-mobile-${dest.id}`}
              aria-selected={isSelected}
              aria-controls={`panel-${dest.id}`}
              onClick={() => onSelect(dest.id)}
              style={{
                backgroundColor: isSelected ? "var(--accent-soft)" : "transparent",
                color: isSelected ? "var(--accent)" : "var(--text-secondary)",
                borderColor: isSelected ? "var(--accent)" : "transparent",
              }}
              className="px-2.5 py-1.5 text-xs font-medium rounded-lg border flex items-center gap-1.5 shrink-0 whitespace-nowrap transition-colors cursor-pointer"
            >
              <Icon name={dest.icon} size={14} />
              <span>{dest.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function DrawerItem({
  dest,
  isSelected,
  onSelect,
}: {
  dest: NavDestination;
  isSelected: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={() => onSelect(dest.id)}
      style={{
        backgroundColor: isSelected ? "var(--accent-soft)" : "transparent",
        color: isSelected ? "var(--accent)" : "var(--text-secondary)",
      }}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer text-left"
    >
      <Icon name={dest.icon} size={18} />
      <span>{dest.label}</span>
    </button>
  );
}

function useDrawerEffects(
  isOpen: boolean,
  onClose: () => void,
  drawerRef: React.RefObject<HTMLDivElement | null>
) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      drawerRef.current?.focus();
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, drawerRef]);
}

function MobileDrawer({
  activeTab,
  onSelect,
  isOpen,
  onClose,
}: {
  activeTab: string;
  onSelect: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
}) {
  const drawerRef = useRef<HTMLDivElement>(null);
  useDrawerEffects(isOpen, onClose, drawerRef);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="presentation">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation Drawer"
        style={{
          backgroundColor: "var(--bg-surface)",
          borderColor: "var(--border-subtle)",
          width: "260px",
          maxWidth: "85vw",
        }}
        className="fixed inset-y-0 left-0 border-r shadow-2xl flex flex-col p-4 animate-in slide-in-from-left duration-200"
      >
        <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: "var(--border-subtle)" }}>
          <BrandLogo width={120} height={36} className="h-8 w-auto object-contain" />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation menu"
            className="p-2 rounded-lg text-muted hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            <Icon name="x" size={20} />
          </button>
        </div>

        <nav role="menu" aria-label="Mobile Navigation Destinations" className="flex-1 py-4 space-y-1 overflow-y-auto">
          {NAV_DESTINATIONS.map((dest) => (
            <DrawerItem
              key={dest.id}
              dest={dest}
              isSelected={activeTab === dest.id}
              onSelect={(id) => {
                onSelect(id);
                onClose();
              }}
            />
          ))}
        </nav>

        <div className="pt-3 border-t text-2xs" style={{ borderColor: "var(--border-subtle)", color: "var(--text-muted)" }}>
          <span>Rules first, AI second.</span>
        </div>
      </div>
    </div>
  );
}

export function MobileNav(props: {
  activeTab: string;
  onSelect: (id: string) => void;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  locationLabel: string;
  aqiCategory: AqiCategory;
}) {
  return (
    <>
      <MobileHeader
        onOpen={props.onOpen}
        locationLabel={props.locationLabel}
        aqiCategory={props.aqiCategory}
      />
      <MobileTabStrip
        activeTab={props.activeTab}
        onSelect={props.onSelect}
      />
      <MobileDrawer
        activeTab={props.activeTab}
        onSelect={props.onSelect}
        isOpen={props.isOpen}
        onClose={props.onClose}
      />
    </>
  );
}
