"use client";

import Link from "next/link";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { DEFAULT_QUICK_ACCESS, readRecentTools, recordRecentTool, searchTools } from "@/lib/tool-discovery";
import { getTool, tools, type Tool } from "@/data/tools";

type LauncherLocation = "header" | "quick_access";
const VALID_SLUGS = new Set(tools.map((tool) => tool.slug));
const RECENTS_CHANGED_EVENT = "buffer:recent-tools-changed";
const OPEN_LAUNCHER_EVENT = "buffer:open-tool-launcher";
const FOCUSABLE_SELECTOR = "a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex='-1'])";

function getQuickSlugs() {
  if (typeof window === "undefined") return DEFAULT_QUICK_ACCESS;
  try {
    const recent = readRecentTools(window.localStorage, VALID_SLUGS);
    return recent.length ? recent : DEFAULT_QUICK_ACCESS;
  } catch {
    return DEFAULT_QUICK_ACCESS;
  }
}

export function HeroToolSearch() {
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const listboxId = useId();
  const results = useMemo(() => query.trim()
    ? searchTools(tools, query, 6)
    : DEFAULT_QUICK_ACCESS.map(getTool).filter((tool): tool is Tool => Boolean(tool)), [query]);

  function openTool(tool: Tool | undefined) {
    if (tool) window.location.assign(`/tools/${tool.slug}`);
  }

  return (
    <div
      className="hero-tool-finder"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setExpanded(false);
      }}
    >
      <form
        className="hero-tool-search"
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          if (!expanded) {
            setExpanded(true);
            return;
          }
          openTool(results[activeIndex] ?? results[0]);
        }}
      >
        <span aria-hidden="true">⌕</span>
        <label className="sr-only" htmlFor={`${listboxId}-input`}>Find a tool</label>
        <input
          id={`${listboxId}-input`}
          value={query}
          onChange={(event) => { setQuery(event.target.value); setActiveIndex(0); setExpanded(true); }}
          onFocus={() => setExpanded(true)}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown" && results.length) {
              event.preventDefault();
              setExpanded(true);
              setActiveIndex((index) => Math.min(results.length - 1, index + 1));
            }
            if (event.key === "ArrowUp" && results.length) {
              event.preventDefault();
              setActiveIndex((index) => Math.max(0, index - 1));
            }
            if (event.key === "Escape") {
              event.preventDefault();
              setExpanded(false);
            }
            if (event.key === "Enter" && expanded && results[activeIndex]) {
              event.preventDefault();
              openTool(results[activeIndex]);
            }
          }}
          placeholder="Find DNS, SSL, JSON, IP tools…"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={expanded}
          aria-controls={listboxId}
          aria-activedescendant={expanded && results[activeIndex] ? `${listboxId}-${results[activeIndex].slug}` : undefined}
          autoComplete="off"
          spellCheck={false}
        />
        <button type="submit">Open <span aria-hidden="true">→</span></button>
      </form>
      {expanded && (
        <div className="hero-search-results" id={listboxId} role="listbox" aria-label={query.trim() ? "Matching tools" : "Suggested tools"}>
          <p>{query.trim() ? `${results.length} match${results.length === 1 ? "" : "es"}` : "Popular tools"}</p>
          {results.map((tool, index) => (
            <Link
              id={`${listboxId}-${tool.slug}`}
              key={tool.slug}
              href={`/tools/${tool.slug}`}
              role="option"
              aria-selected={index === activeIndex}
              className={index === activeIndex ? "is-active" : ""}
              onMouseEnter={() => setActiveIndex(index)}
            >
              <span><strong>{tool.name}</strong><small>{tool.description}</small></span>
              <em aria-hidden="true">→</em>
            </Link>
          ))}
          {!results.length && <div className="launcher-empty">No tools match that search.</div>}
        </div>
      )}
    </div>
  );
}

export function ToolLauncher() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [quickSlugs, setQuickSlugs] = useState(DEFAULT_QUICK_ACCESS);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const listboxId = useId();

  const results = useMemo(() => query.trim()
    ? searchTools(tools, query)
    : quickSlugs.map(getTool).filter((tool): tool is Tool => Boolean(tool)), [query, quickSlugs]);

  function show(location: LauncherLocation) {
    openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : triggerRef.current;
    setQuickSlugs(getQuickSlugs());
    setOpen(true);
    setQuery("");
    setActiveIndex(0);
  }

  function close() {
    setOpen(false);
    window.setTimeout(() => openerRef.current?.focus(), 0);
  }

  function choose() {
    setOpen(false);
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        open ? close() : show("header");
      } else if (open && event.key === "Escape") {
        event.preventDefault();
        close();
      } else if (open && event.key === "Tab") {
        const focusable = Array.from(panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR) ?? []);
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }

    function onOpen(event: Event) {
      const location = (event as CustomEvent<LauncherLocation>).detail;
      show(location === "quick_access" ? "quick_access" : "header");
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener(OPEN_LAUNCHER_EVENT, onOpen);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener(OPEN_LAUNCHER_EVENT, onOpen);
    };
  }, [open]);

  useEffect(() => {
    if (open) window.setTimeout(() => inputRef.current?.focus(), 0);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [open]);

  return (
    <>
      <button ref={triggerRef} className="launcher-trigger" type="button" onClick={() => show("header")} aria-haspopup="dialog" aria-label="Find a tool">
        <span className="launcher-icon" aria-hidden="true">⌕</span>
        <span className="launcher-label">Find a tool</span>
        <kbd>⌘/Ctrl K</kbd>
      </button>
      {open && (
        <div className="launcher-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
          <div ref={panelRef} className="tool-launcher" role="dialog" aria-modal="true" aria-labelledby="tool-launcher-title">
            <div className="launcher-search-row">
              <span aria-hidden="true">⌕</span>
              <label className="sr-only" htmlFor="tool-launcher-search" id="tool-launcher-title">Find a tool</label>
              <input
                ref={inputRef}
                id="tool-launcher-search"
                value={query}
                onChange={(event) => { setQuery(event.target.value); setActiveIndex(0); }}
                onKeyDown={(event) => {
                  if (event.key === "ArrowDown") { event.preventDefault(); setActiveIndex((index) => Math.min(results.length - 1, index + 1)); }
                  if (event.key === "ArrowUp") { event.preventDefault(); setActiveIndex((index) => Math.max(0, index - 1)); }
                  if (event.key === "Enter" && results[activeIndex]) {
                    event.preventDefault();
                    choose();
                    window.location.assign(`/tools/${results[activeIndex].slug}`);
                  }
                }}
                placeholder="Search names, commands, or keywords…"
                role="combobox"
                aria-autocomplete="list"
                aria-expanded="true"
                aria-controls={listboxId}
                aria-activedescendant={results[activeIndex] ? `${listboxId}-${results[activeIndex].slug}` : undefined}
                autoComplete="off"
              />
              <button type="button" onClick={close} aria-label="Close tool launcher">Esc</button>
            </div>
            <div className="launcher-results" id={listboxId} role="listbox" aria-label={query.trim() ? "Matching tools" : "Quick access tools"}>
              <p>{query.trim() ? `${results.length} match${results.length === 1 ? "" : "es"}` : "Quick access"}</p>
              {results.map((tool, index) => (
                <Link
                  key={tool.slug}
                  id={`${listboxId}-${tool.slug}`}
                  href={`/tools/${tool.slug}`}
                  className={index === activeIndex ? "is-active" : ""}
                  role="option"
                  aria-selected={index === activeIndex}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={choose}
                >
                  <span className="command-icon" aria-hidden="true">{tool.command}</span>
                  <span><strong>{tool.name}</strong><small>{tool.description}</small></span>
                  <em aria-hidden="true">→</em>
                </Link>
              ))}
              {!results.length && <div className="launcher-empty">No tools match every search term.</div>}
            </div>
            <footer><span>↑↓ Navigate</span><span>↵ Open</span><span>Esc Close</span></footer>
          </div>
        </div>
      )}
    </>
  );
}

export function QuickAccess() {
  const [slugs, setSlugs] = useState(DEFAULT_QUICK_ACCESS);

  useEffect(() => {
    const refresh = () => setSlugs(getQuickSlugs());
    refresh();
    window.addEventListener(RECENTS_CHANGED_EVENT, refresh);
    return () => window.removeEventListener(RECENTS_CHANGED_EVENT, refresh);
  }, []);

  const quickTools = slugs.map(getTool).filter((tool): tool is Tool => Boolean(tool));

  return (
    <section className="quick-access" aria-label="Quick access tools">
      <span>Quick access</span>
      <div>{quickTools.map((tool) => (
        <Link key={tool.slug} href={`/tools/${tool.slug}`}>{tool.name}</Link>
      ))}</div>
      <button type="button" onClick={() => window.dispatchEvent(new CustomEvent(OPEN_LAUNCHER_EVENT, { detail: "quick_access" }))}>Find another <span aria-hidden="true">⌘K</span></button>
    </section>
  );
}

export function ToolVisitTracker({ slug }: { slug: string }) {
  useEffect(() => {
    try {
      recordRecentTool(window.localStorage, slug, VALID_SLUGS);
      window.dispatchEvent(new Event(RECENTS_CHANGED_EVENT));
    } catch { /* Recent tools are intentionally best-effort. */ }
  }, [slug]);
  return null;
}

export function RelatedTools({ related, target }: { related: Tool[]; target?: string }) {
  return (
    <nav className="related-tools" aria-label="Related tools">
      <span>Continue diagnosing</span>
      <div>{related.map((tool) => {
        const href = target && tool.supportsTargetPrefill
          ? `/tools/${tool.slug}?target=${encodeURIComponent(target)}`
          : `/tools/${tool.slug}`;
        return <Link key={tool.slug} href={href}>{tool.name}<span aria-hidden="true">→</span></Link>;
      })}</div>
    </nav>
  );
}
