"use client";

import { useState, useSyncExternalStore } from "react";
import type { Tool } from "@/data/tools";
import { ResultPanel } from "./ResultPanel";

export function ToolExperience({ tool }: { tool: Tool }) {
  switch (tool.slug) {
    case "json-formatter": return <JsonFormatter />;
    case "base64": return <Base64Tool />;
    case "hash-generator": return <HashGenerator />;
    case "uuid-generator": return <UuidGenerator />;
    case "timestamp": return <TimestampConverter />;
    case "user-agent": return <UserAgentParser />;
    default: return <BackendPlaceholder tool={tool} />;
  }
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="field-label">{children}</span>;
}

function JsonFormatter() {
  const [input, setInput] = useState('{"hello":"world","tools":["ping","dns","json"]}');
  const [output, setOutput] = useState("Run the formatter to see validated JSON.");
  const [state, setState] = useState<"idle" | "success" | "error">("idle");

  function transform(minify = false) {
    try {
      setOutput(JSON.stringify(JSON.parse(input), null, minify ? 0 : 2));
      setState("success");
    } catch (error) {
      setOutput(error instanceof Error ? error.message : "Invalid JSON input.");
      setState("error");
    }
  }

  return (
    <>
      <section className="tool-controls">
        <label><FieldLabel>JSON input</FieldLabel><textarea value={input} onChange={(event) => setInput(event.target.value)} spellCheck={false} /></label>
        <div className="button-row">
          <button className="primary-button" onClick={() => transform()} type="button">Format JSON <span>→</span></button>
          <button className="secondary-button" onClick={() => transform(true)} type="button">Minify</button>
          <button className="ghost-button" onClick={() => { setInput(""); setOutput("Run the formatter to see validated JSON."); setState("idle"); }} type="button">Clear</button>
        </div>
        <p className="privacy-note"><span>●</span> Processed locally in your browser.</p>
      </section>
      <ResultPanel title="formatted.json" status={state}><pre>{output}</pre></ResultPanel>
    </>
  );
}

function Base64Tool() {
  const [input, setInput] = useState("Fast, simple networking tools.");
  const [output, setOutput] = useState("Choose encode or decode.");
  const [state, setState] = useState<"idle" | "success" | "error">("idle");

  function encode() {
    try {
      const bytes = new TextEncoder().encode(input);
      let binary = "";
      bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
      setOutput(btoa(binary));
      setState("success");
    } catch { setOutput("Could not encode this value."); setState("error"); }
  }

  function decode() {
    try {
      const binary = atob(input.trim());
      const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
      setOutput(new TextDecoder().decode(bytes));
      setState("success");
    } catch { setOutput("Invalid Base64 input."); setState("error"); }
  }

  return (
    <>
      <section className="tool-controls">
        <label><FieldLabel>Text or Base64</FieldLabel><textarea value={input} onChange={(event) => setInput(event.target.value)} spellCheck={false} /></label>
        <div className="button-row">
          <button className="primary-button" onClick={encode} type="button">Encode <span>→</span></button>
          <button className="secondary-button" onClick={decode} type="button">Decode</button>
        </div>
        <p className="privacy-note"><span>●</span> UTF-8 safe and processed locally.</p>
      </section>
      <ResultPanel title="base64.txt" status={state}><pre className="wrap-output">{output}</pre></ResultPanel>
    </>
  );
}

function HashGenerator() {
  const [input, setInput] = useState("buffer.lol");
  const [algorithm, setAlgorithm] = useState("SHA-256");
  const [output, setOutput] = useState("Generate a cryptographic digest.");
  const [state, setState] = useState<"idle" | "success" | "error" | "pending">("idle");

  async function generate() {
    setState("pending");
    try {
      const digest = await crypto.subtle.digest(algorithm, new TextEncoder().encode(input));
      setOutput(Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join(""));
      setState("success");
    } catch { setOutput("Hash generation is unavailable in this browser context."); setState("error"); }
  }

  return (
    <>
      <section className="tool-controls">
        <label><FieldLabel>Input text</FieldLabel><textarea value={input} onChange={(event) => setInput(event.target.value)} /></label>
        <label><FieldLabel>Algorithm</FieldLabel><select value={algorithm} onChange={(event) => setAlgorithm(event.target.value)}><option>SHA-256</option><option>SHA-384</option><option>SHA-512</option></select></label>
        <div className="button-row"><button className="primary-button" onClick={generate} type="button">Generate hash <span>→</span></button></div>
        <p className="privacy-note"><span>●</span> Uses the browser Web Crypto API.</p>
      </section>
      <ResultPanel title="digest.txt" status={state}><pre className="wrap-output">{output}</pre></ResultPanel>
    </>
  );
}

function UuidGenerator() {
  const [count, setCount] = useState(4);
  const [uuids, setUuids] = useState<string[]>([]);

  function generate() {
    setUuids(Array.from({ length: count }, () => crypto.randomUUID()));
  }

  return (
    <>
      <section className="tool-controls">
        <label><FieldLabel>Number of UUIDs</FieldLabel><select value={count} onChange={(event) => setCount(Number(event.target.value))}><option value="1">1 UUID</option><option value="4">4 UUIDs</option><option value="10">10 UUIDs</option><option value="25">25 UUIDs</option></select></label>
        <div className="button-row"><button className="primary-button" onClick={generate} type="button">Generate UUIDs <span>→</span></button></div>
        <p className="privacy-note"><span>●</span> Generated securely in your browser.</p>
      </section>
      <ResultPanel title="uuids.txt" status={uuids.length ? "success" : "idle"}>
        {uuids.length ? <ol className="uuid-list">{uuids.map((uuid, index) => <li key={uuid}><span>{String(index + 1).padStart(2, "0")}</span>{uuid}</li>)}</ol> : <p className="terminal-empty">$ waiting for generation<span className="cursor" /></p>}
      </ResultPanel>
    </>
  );
}

function TimestampConverter() {
  const [timestamp, setTimestamp] = useState(() => Math.floor(Date.now() / 1000).toString());
  const [date, setDate] = useState(() => toLocalInputValue(new Date()));
  const parsedTimestamp = Number(timestamp);
  const timestampDate = Number.isFinite(parsedTimestamp) ? new Date(parsedTimestamp * (timestamp.length > 10 ? 1 : 1000)) : null;
  const parsedDate = new Date(date);

  return (
    <>
      <section className="tool-controls">
        <label><FieldLabel>Unix timestamp</FieldLabel><input value={timestamp} onChange={(event) => setTimestamp(event.target.value)} inputMode="numeric" /></label>
        <label><FieldLabel>Local date and time</FieldLabel><input type="datetime-local" value={date} onChange={(event) => setDate(event.target.value)} /></label>
        <div className="button-row"><button className="primary-button" onClick={() => { setTimestamp(Math.floor(Date.now() / 1000).toString()); setDate(toLocalInputValue(new Date())); }} type="button">Use current time <span>↻</span></button></div>
        <p className="privacy-note"><span>●</span> Values update as you type.</p>
      </section>
      <ResultPanel title="time.output" status="success">
        <dl className="result-list">
          <div><dt>Timestamp → UTC</dt><dd>{timestampDate && !Number.isNaN(timestampDate.getTime()) ? timestampDate.toISOString() : "Invalid timestamp"}</dd></div>
          <div><dt>Timestamp → local</dt><dd>{timestampDate && !Number.isNaN(timestampDate.getTime()) ? timestampDate.toLocaleString() : "Invalid timestamp"}</dd></div>
          <div><dt>Date → seconds</dt><dd>{!Number.isNaN(parsedDate.getTime()) ? Math.floor(parsedDate.getTime() / 1000) : "Invalid date"}</dd></div>
          <div><dt>Date → milliseconds</dt><dd>{!Number.isNaN(parsedDate.getTime()) ? parsedDate.getTime() : "Invalid date"}</dd></div>
        </dl>
      </ResultPanel>
    </>
  );
}

function UserAgentParser() {
  const isClient = useSyncExternalStore(() => () => undefined, () => true, () => false);
  const details = isClient
    ? {
      userAgent: navigator.userAgent,
      platform: navigator.userAgentData?.platform || navigator.platform || "Unknown",
      language: navigator.language,
      cookies: navigator.cookieEnabled ? "Enabled" : "Disabled",
      touch: navigator.maxTouchPoints ? `${navigator.maxTouchPoints} touch point(s)` : "Not detected"
    }
    : null;

  return (
    <>
      <section className="tool-controls info-card">
        <span className="command-icon large">ua</span>
        <h2>Browser signals</h2>
        <p>This page reads only the standard environment values exposed to client-side JavaScript.</p>
        <p className="privacy-note"><span>●</span> Nothing is sent to buffer.lol.</p>
      </section>
      <ResultPanel title="navigator.json" status={details ? "success" : "pending"}>
        {details ? <dl className="result-list"><div><dt>User agent</dt><dd>{details.userAgent}</dd></div><div><dt>Platform</dt><dd>{details.platform}</dd></div><div><dt>Language</dt><dd>{details.language}</dd></div><div><dt>Cookies</dt><dd>{details.cookies}</dd></div><div><dt>Touch</dt><dd>{details.touch}</dd></div></dl> : <p className="terminal-empty">$ reading navigator<span className="cursor" /></p>}
      </ResultPanel>
    </>
  );
}

function BackendPlaceholder({ tool }: { tool: Tool }) {
  const [input, setInput] = useState(tool.slug === "my-ip" ? "" : "");
  const [state, setState] = useState<"idle" | "pending" | "error">("idle");

  function previewRequest(event: React.FormEvent) {
    event.preventDefault();
    setState("pending");
    window.setTimeout(() => setState("error"), 650);
  }

  // TODO(api): Connect these backend-required tools to their hardened server endpoints.
  // Ping Tester, Packet Loss Tester, Traceroute Visualizer, DNS Lookup,
  // HTTP Header Inspector, SSL Certificate Checker, Uptime Checker, Port Checker,
  // What's My IP, IP Geolocation, and ASN / ISP Lookup.
  return (
    <>
      <form className="tool-controls" onSubmit={previewRequest}>
        <div className="backend-banner"><span>Backend required</span><p>The interface is ready; live network requests are not connected yet.</p></div>
        <label>
          <FieldLabel>{tool.inputLabel || "Target"}</FieldLabel>
          <input value={input} onChange={(event) => setInput(event.target.value)} placeholder={tool.inputPlaceholder} disabled={tool.slug === "my-ip"} required={tool.slug !== "my-ip"} />
        </label>
        <div className="button-row"><button className="primary-button" disabled={state === "pending"} type="submit">{state === "pending" ? "Checking…" : tool.slug === "my-ip" ? "Detect my IP" : "Run check"} <span>→</span></button></div>
        <p className="helper-text">No request will leave your browser in this preview.</p>
      </form>
      <ResultPanel title={`${tool.slug}.output`} status={state}>
        {state === "idle" && <p className="terminal-empty"><span className="prompt">$</span> waiting for input<span className="cursor" /></p>}
        {state === "pending" && <div className="loading-lines" aria-label="Loading"><span /><span /><span /></div>}
        {state === "error" && <div className="backend-result"><span>COMING SOON</span><h3>Backend connection pending</h3><p>This was a UI preview only. No live result was generated or presented.</p><code># TODO: connect /api/{tool.slug}</code></div>}
      </ResultPanel>
    </>
  );
}

function toLocalInputValue(date: Date) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

declare global {
  interface Navigator {
    userAgentData?: { platform?: string };
  }
}
