"use client";

import Link from "next/link";
import { useState } from "react";
import type { Tool } from "@/data/tools";
import type {
  DiagnosticStatus,
  DnsRecordType,
  EmailDnsHealthResult,
  HttpSecurityResult,
  ResolverComparisonResult,
  ResolverStatus
} from "@/app/api/_lib/diagnostic-types";
import { DNS_RECORD_TYPES } from "@/app/api/_lib/diagnostic-types";
import { ResultPanel } from "./ResultPanel";

type Envelope = { data?: unknown; error?: string; durationMs?: number; requestId?: string };
type RunState =
  | { kind: "idle" }
  | { kind: "pending" }
  | { kind: "error"; message: string; requestId?: string }
  | { kind: "success"; data: unknown; durationMs?: number };

export function DiagnosticToolExperience({ tool, initialTarget = "" }: { tool: Tool; initialTarget?: string }) {
  if (tool.slug === "dns-resolver-check") return <ResolverComparison tool={tool} initialTarget={initialTarget} />;
  if (tool.slug === "email-dns-health") return <EmailDnsHealth tool={tool} initialTarget={initialTarget} />;
  return <SecurityHeaders tool={tool} initialTarget={initialTarget} />;
}

function ResolverComparison({ tool, initialTarget }: { tool: Tool; initialTarget: string }) {
  const [domain, setDomain] = useState(initialTarget);
  const [recordType, setRecordType] = useState<DnsRecordType>("A");
  const [state, run] = useDiagnosticRequest(tool.slug);

  return (
    <>
      <form className="tool-controls" onSubmit={(event) => { event.preventDefault(); run(domain, { recordType }); }}>
        <DiagnosticBanner>Compares public recursive resolvers; it is not a geographic propagation map.</DiagnosticBanner>
        <label><FieldLabel>Domain name</FieldLabel><input value={domain} onChange={(event) => setDomain(event.target.value)} placeholder="example.com" required /></label>
        <label><FieldLabel>Record type</FieldLabel><select value={recordType} onChange={(event) => setRecordType(event.target.value as DnsRecordType)}>{DNS_RECORD_TYPES.map((type) => <option key={type}>{type}</option>)}</select></label>
        <RunButton pending={state.kind === "pending"}>Compare resolvers</RunButton>
        <p className="helper-text">Queries Cloudflare, Google, Quad9, and OpenDNS concurrently. TTL differences are ignored.</p>
      </form>
      <DiagnosticPanel slug={tool.slug} state={state}>{state.kind === "success" && <ResolverResults result={state.data as ResolverComparisonResult} />}</DiagnosticPanel>
    </>
  );
}

function EmailDnsHealth({ tool, initialTarget }: { tool: Tool; initialTarget: string }) {
  const [domain, setDomain] = useState(initialTarget);
  const [selector, setSelector] = useState("");
  const [state, run] = useDiagnosticRequest(tool.slug);

  return (
    <>
      <form className="tool-controls" onSubmit={(event) => { event.preventDefault(); run(domain, selector.trim() ? { dkimSelector: selector } : undefined); }}>
        <DiagnosticBanner>Checks published DNS configuration—not inbox placement, reputation, or complete deliverability.</DiagnosticBanner>
        <label><FieldLabel>Email domain</FieldLabel><input value={domain} onChange={(event) => setDomain(event.target.value)} placeholder="example.com" required /></label>
        <label><FieldLabel>DKIM selector (optional)</FieldLabel><input value={selector} onChange={(event) => setSelector(event.target.value)} placeholder="google, selector1, default…" /></label>
        <RunButton pending={state.kind === "pending"}>Check email DNS</RunButton>
        <p className="helper-text">MX, SPF, DMARC, DKIM, MTA-STS, and TLS reporting are queried concurrently.</p>
      </form>
      <DiagnosticPanel slug={tool.slug} state={state}>{state.kind === "success" && <EmailResults result={state.data as EmailDnsHealthResult} />}</DiagnosticPanel>
    </>
  );
}

function SecurityHeaders({ tool, initialTarget }: { tool: Tool; initialTarget: string }) {
  const [url, setUrl] = useState(initialTarget);
  const [state, run] = useDiagnosticRequest(tool.slug);

  return (
    <>
      <form className="tool-controls" onSubmit={(event) => { event.preventDefault(); run(url); }}>
        <DiagnosticBanner>Inspects the final response after at most five safely validated redirects. No letter grade is assigned.</DiagnosticBanner>
        <label><FieldLabel>HTTP or HTTPS URL</FieldLabel><input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://example.com" required /></label>
        <RunButton pending={state.kind === "pending"}>Inspect security headers</RunButton>
        <p className="helper-text">Uses HEAD when supported and does not download the page body.</p>
      </form>
      <DiagnosticPanel slug={tool.slug} state={state}>{state.kind === "success" && <SecurityResults result={state.data as HttpSecurityResult} />}</DiagnosticPanel>
    </>
  );
}

function useDiagnosticRequest(slug: string): [RunState, (input: string, options?: Record<string, string>) => Promise<void>] {
  const [state, setState] = useState<RunState>({ kind: "idle" });

  async function run(input: string, options?: Record<string, string>) {
    setState({ kind: "pending" });
    try {
      const response = await fetch(`/api/tools/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input, ...(options ? { options } : {}) })
      });
      const payload = await response.json() as Envelope;
      if (!response.ok || payload.error) {
        setState({ kind: "error", message: payload.error || `Request failed with HTTP ${response.status}.`, requestId: payload.requestId });
        return;
      }
      setState({ kind: "success", data: payload.data, durationMs: payload.durationMs });
    } catch (error) {
      setState({ kind: "error", message: error instanceof Error ? error.message : "The diagnostics request failed." });
    }
  }

  return [state, run];
}

function DiagnosticPanel({ slug, state, children }: { slug: string; state: RunState; children: React.ReactNode }) {
  const status = state.kind === "success" ? "success" : state.kind === "error" ? "error" : state.kind === "pending" ? "pending" : "idle";
  return (
    <ResultPanel title={`${slug}.output`} status={status}>
      {state.kind === "idle" && <p className="terminal-empty"><span className="prompt">$</span> waiting for a target<span className="cursor" /></p>}
      {state.kind === "pending" && <div className="loading-lines" aria-label="Loading"><span /><span /><span /></div>}
      {state.kind === "error" && <div className="backend-result"><span>ERROR</span><h3>Request did not complete</h3><p>{state.message}</p>{state.requestId && <code>requestId: {state.requestId}</code>}</div>}
      {state.kind === "success" && <div className="stacked-output"><div className="result-actions"><CopyJsonButton value={state.data} /></div>{children}</div>}
    </ResultPanel>
  );
}

function ResolverResults({ result }: { result: ResolverComparisonResult }) {
  return (
    <>
      <div className="diagnostic-summary-line"><StatusChip status={result.summary.allSuccessfulAnswersAgree ? "pass" : "warning"} label={result.summary.allSuccessfulAnswersAgree ? "Answers agree" : "Answers differ"} /><span>{result.summary.uniqueAnswerSets} unique answer set{result.summary.uniqueAnswerSets === 1 ? "" : "s"} · {result.summary.successfulResolvers}/{result.summary.totalResolvers} answered</span></div>
      <div className="resolver-grid">{result.resolvers.map((resolver) => (
        <article key={resolver.id} className="diagnostic-row resolver-row">
          <header><div><strong>{resolver.name}</strong><small>{resolver.address} · {resolver.latencyMs}ms</small></div><StatusChip status={resolver.status} /></header>
          {resolver.answers.length ? <ul>{resolver.answers.map((answer) => <li key={answer}>{answer}</li>)}</ul> : <p>{resolver.error || "No answer was returned."}</p>}
        </article>
      ))}</div>
      <WorkflowLinks target={result.domain} links={["dns-lookup", "email-dns-health"]} />
    </>
  );
}

function EmailResults({ result }: { result: EmailDnsHealthResult }) {
  return (
    <>
      <SummaryCounts summary={result.summary} />
      <div className="diagnostic-checks">{result.checks.map((check) => (
        <article className="diagnostic-row" key={check.id}>
          <header><strong>{check.label}</strong><StatusChip status={check.status} /></header>
          <p>{check.summary}</p>
          {check.records?.length ? <ul>{check.records.map((record) => <li key={record}>{record}</li>)}</ul> : null}
        </article>
      ))}</div>
      <p className="result-note">This report checks published DNS configuration only. It does not measure inbox placement, sender reputation, or complete deliverability.</p>
      <WorkflowLinks target={result.domain} links={["dns-lookup", "dns-resolver-check", "ssl-checker"]} />
    </>
  );
}

function SecurityResults({ result }: { result: HttpSecurityResult }) {
  return (
    <>
      <dl className="result-list diagnostic-meta"><div><dt>Requested URL</dt><dd>{result.requestedUrl}</dd></div><div><dt>Final URL</dt><dd>{result.finalUrl}</dd></div><div><dt>Response</dt><dd>HTTP {result.statusCode} · {result.redirectCount} redirect{result.redirectCount === 1 ? "" : "s"}</dd></div></dl>
      <SummaryCounts summary={result.summary} />
      <div className="diagnostic-checks">{result.checks.map((check) => (
        <article className="diagnostic-row" key={check.id}>
          <header><strong>{check.label}</strong><StatusChip status={check.status} /></header>
          <p>{check.summary}</p>
          {check.observedValue && <code>{check.observedValue}</code>}
          {check.recommendation && <small>{check.recommendation}</small>}
        </article>
      ))}</div>
      <WorkflowLinks target={result.finalUrl} links={["http-headers", "redirect-checker", "ssl-checker"]} />
    </>
  );
}

function SummaryCounts({ summary }: { summary: Record<DiagnosticStatus, number> }) {
  return <div className="summary-counts">{(["pass", "warning", "fail", "info", "error"] as const).filter((status) => summary[status] > 0).map((status) => <span key={status}><StatusChip status={status} /> <strong>{summary[status]}</strong></span>)}</div>;
}

export function StatusChip({ status, label }: { status: DiagnosticStatus | ResolverStatus; label?: string }) {
  return <span className={`status-chip status-chip-${status}`}>{label || status.replace("-", " ")}</span>;
}

function WorkflowLinks({ target, links }: { target: string; links: string[] }) {
  const names: Record<string, string> = { "dns-lookup": "DNS Lookup", "email-dns-health": "Email DNS Health", "dns-resolver-check": "DNS Resolver Comparison", "ssl-checker": "SSL Certificate Checker", "http-headers": "HTTP Header Inspector", "redirect-checker": "Redirect Checker" };
  return <div className="result-workflows">{links.map((slug) => <Link key={slug} href={`/tools/${slug}?target=${encodeURIComponent(target)}`}>{names[slug]} <span aria-hidden="true">→</span></Link>)}</div>;
}

function CopyJsonButton({ value }: { value: unknown }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(JSON.stringify(value, null, 2));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 3_000);
    } catch { setCopied(false); }
  }
  return <button className="copy-button" type="button" onClick={copy}>{copied ? "Copied" : "Copy results as JSON"}</button>;
}

function DiagnosticBanner({ children }: { children: React.ReactNode }) {
  return <div className="backend-banner is-live"><span>Server diagnostic</span><p>{children}</p></div>;
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="field-label">{children}</span>;
}

function RunButton({ pending, children }: { pending: boolean; children: React.ReactNode }) {
  return <div className="button-row"><button className="primary-button" disabled={pending} type="submit">{pending ? "Checking…" : children} <span>→</span></button></div>;
}
