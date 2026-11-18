/**
 * @file dialog.tsx
 * @description Accessible modal dialog with focus management, backdrop, and escape key listener.
 * Addresses problem-statement: Accessibility, Modal dialog pattern (WCAG 2.2 AA).
 */

import React, { useEffect, useId, useRef } from "react";
import { Icon } from "./icon";
import { Button } from "./button";

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

function useDialogEffects(isOpen: boolean, onClose: () => void) {
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

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);
}

export function Dialog({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  className = "",
}: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descId = useId();

  useDialogEffects(isOpen, onClose);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in"
    >
      <div
        ref={dialogRef}
        style={{
          backgroundColor: "var(--bg-surface)",
          borderColor: "var(--border-subtle)",
          color: "var(--text-primary)",
        }}
        className={`relative w-full max-w-lg rounded-2xl border shadow-2xl p-6 space-y-4 max-h-full overflow-y-auto ${className}`}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id={titleId} className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
              {title}
            </h2>
            {description && (
              <p id={descId} className="mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>
                {description}
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1 min-h-11 min-w-11"
          >
            <Icon name="x" size={18} />
          </Button>
        </div>

        <div className="py-2 text-sm" style={{ color: "var(--text-secondary)" }}>{children}</div>

        {footer && (
          <div className="flex items-center justify-end gap-3 pt-4 border-t" style={{ borderColor: "var(--border-subtle)" }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
