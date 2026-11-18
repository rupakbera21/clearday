/**
 * @file sheet.tsx
 * @description Accessible slide-over drawer / bottom sheet for mobile filters and panels.
 * Addresses problem-statement: Mobile-first ergonomic touch experience.
 */

import React, { useEffect, useId, useRef } from "react";
import { Icon } from "./icon";
import { Button } from "./button";

export interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  position?: "bottom" | "right";
  className?: string;
}

export function Sheet({
  isOpen,
  onClose,
  title,
  description,
  children,
  position = "bottom",
  className = "",
}: SheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const positionClasses =
    position === "bottom"
      ? "bottom-0 inset-x-0 rounded-t-3xl max-h-full"
      : "right-0 inset-y-0 w-full max-w-md rounded-l-3xl";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      className="fixed inset-0 z-50 flex bg-black/80 backdrop-blur-xs"
    >
      <div
        ref={sheetRef}
        className={`fixed bg-slate-900 border-t sm:border-l border-slate-700 shadow-2xl p-6 text-slate-100 flex flex-col overflow-y-auto ${positionClasses} ${className}`}
      >
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h2 id={titleId} className="text-lg font-bold text-slate-100">
              {title}
            </h2>
            {description && (
              <p id={descId} className="mt-1 text-sm text-slate-400">
                {description}
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Close sheet"
            className="p-1 min-h-11 min-w-11"
          >
            <Icon name="x" size={18} />
          </Button>
        </div>

        <div className="py-4 flex-1 text-sm text-slate-300">{children}</div>
      </div>
    </div>
  );
}
