"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { categoryMeta, getToolsByCategory, type ToolCategory } from "@/data/tools";

const categories: ToolCategory[] = ["networking", "ip", "developer"];

export function MobileNavigation({ homePrefix = "/" }: { homePrefix?: string }) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  function close(restoreFocus = false) {
    setOpen(false);
    if (restoreFocus) window.setTimeout(() => triggerRef.current?.focus(), 0);
  }

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        close(true);
      }
    }

    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) close();
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  return (
    <div className="mobile-navigation" ref={rootRef}>
      <button
        ref={triggerRef}
        className="mobile-nav-trigger"
        type="button"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="mobile-nav-icon" aria-hidden="true"><i /><i /><i /></span>
        <span className="sr-only">{open ? "Close navigation" : "Open navigation"}</span>
      </button>
      {open && (
        <nav className="mobile-nav-panel" id={menuId} aria-label="Mobile navigation">
          <p>Browse buffer.lol</p>
          {categories.map((category) => (
            <Link href={`${homePrefix}#${category}`} onClick={() => close()} key={category}>
              <span>{categoryMeta[category].title}</span>
              <strong>{getToolsByCategory(category).length} tools</strong>
            </Link>
          ))}
          <Link href="/ip-lens" onClick={() => close()}><span>IP Lens</span><strong>iPhone app</strong></Link>
        </nav>
      )}
    </div>
  );
}
