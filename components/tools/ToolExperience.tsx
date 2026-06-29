"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
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
    case "url-parser": return <UrlParser />;
    case "jwt-decoder": return <JwtDecoder />;
    case "regex-tester": return <RegexTester />;
    case "cidr-calculator": return <CidrCalculator />;
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

type UrlResult =
  | { kind: "idle"; message: string }
  | { kind: "error"; message: string }
  | { kind: "url"; assumedProtocol: boolean; fields: Array<[string, string]>; params: Array<[string, string]> }
  | { kind: "transform"; label: string; value: string };

function UrlParser() {
  const [input, setInput] = useState("https://example.com/search?q=buffer.lol&debug=true#results");
  const [componentInput, setComponentInput] = useState("buffer.lol tools & checks");
  const [result, setResult] = useState<UrlResult>({ kind: "idle", message: "Parse a URL or encode a component." });
  const status = result.kind === "error" ? "error" : result.kind === "idle" ? "idle" : "success";

  function parseUrl() {
    const rawInput = input.trim();
    const hasProtocol = /^[a-z][a-z\d+.-]*:/i.test(rawInput);

    if (!rawInput) {
      setResult({ kind: "error", message: "Enter a URL to parse." });
      return;
    }

    try {
      const parsed = new URL(rawInput);
      setResult(toUrlResult(parsed, false));
    } catch (firstError) {
      if (hasProtocol) {
        setResult({ kind: "error", message: firstError instanceof Error ? firstError.message : "Invalid URL." });
        return;
      }

      try {
        setResult(toUrlResult(new URL(`https://${rawInput}`), true));
      } catch (fallbackError) {
        setResult({ kind: "error", message: fallbackError instanceof Error ? fallbackError.message : "Invalid URL." });
      }
    }
  }

  function encodeComponent() {
    try {
      setResult({ kind: "transform", label: "Encoded component", value: encodeURIComponent(componentInput) });
    } catch {
      setResult({ kind: "error", message: "Could not encode this component." });
    }
  }

  function decodeComponent() {
    try {
      setResult({ kind: "transform", label: "Decoded component", value: decodeURIComponent(componentInput) });
    } catch (error) {
      setResult({ kind: "error", message: error instanceof Error ? error.message : "Malformed encoded component." });
    }
  }

  return (
    <>
      <section className="tool-controls">
        <label><FieldLabel>URL</FieldLabel><input value={input} onChange={(event) => setInput(event.target.value)} spellCheck={false} /></label>
        <label><FieldLabel>Component text</FieldLabel><textarea className="short-textarea" value={componentInput} onChange={(event) => setComponentInput(event.target.value)} spellCheck={false} /></label>
        <div className="button-row">
          <button className="primary-button" onClick={parseUrl} type="button">Parse URL <span>→</span></button>
          <button className="secondary-button" onClick={encodeComponent} type="button">Encode</button>
          <button className="secondary-button" onClick={decodeComponent} type="button">Decode</button>
          <button className="ghost-button" onClick={() => { setInput(""); setComponentInput(""); setResult({ kind: "idle", message: "Parse a URL or encode a component." }); }} type="button">Clear</button>
        </div>
        <p className="privacy-note"><span>●</span> URLs and text are processed locally in your browser.</p>
      </section>
      <ResultPanel title="url.output" status={status}>
        {result.kind === "idle" && <p className="terminal-empty">$ {result.message}<span className="cursor" /></p>}
        {result.kind === "error" && <pre className="wrap-output">{result.message}</pre>}
        {result.kind === "transform" && <dl className="result-list"><div><dt>{result.label}</dt><dd>{result.value}</dd></div></dl>}
        {result.kind === "url" && (
          <>
            {result.assumedProtocol && <p className="result-note">No protocol was supplied, so https:// was assumed for parsing.</p>}
            <dl className="result-list">
              {result.fields.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || "(empty)"}</dd></div>)}
              <div><dt>Query params</dt><dd>{result.params.length ? <ol className="inline-result-list">{result.params.map(([key, value], index) => <li key={`${key}-${index}`}><strong>{key}</strong><span>{value}</span></li>)}</ol> : "None"}</dd></div>
            </dl>
          </>
        )}
      </ResultPanel>
    </>
  );
}

type JwtDateClaim = { name: string; value: number; local: string; utc: string };

type JwtResult =
  | { kind: "idle"; message: string }
  | { kind: "error"; message: string }
  | { kind: "success"; header: unknown; payload: Record<string, unknown>; hasSignature: boolean; dateClaims: JwtDateClaim[] };

function JwtDecoder() {
  const [token, setToken] = useState("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJidWZmZXIubG9sIiwiaWF0IjoxNzAwMDAwMDAwLCJleHAiOjE3MDAwMDM2MDB9.signature");
  const [result, setResult] = useState<JwtResult>({ kind: "idle", message: "Decode a JWT header and payload." });
  const status = result.kind === "error" ? "error" : result.kind === "idle" ? "idle" : "success";

  function decodeToken() {
    const parts = token.trim().split(".");

    if (parts.length < 2 || !parts[0] || !parts[1]) {
      setResult({ kind: "error", message: "JWTs need at least header and payload segments separated by dots." });
      return;
    }

    try {
      const header = decodeJwtSegment(parts[0]);
      const payload = decodeJwtSegment(parts[1]);

      if (!isRecord(payload)) {
        setResult({ kind: "error", message: "JWT payload decoded, but it is not a JSON object." });
        return;
      }

      setResult({
        kind: "success",
        header,
        payload,
        hasSignature: Boolean(parts[2]),
        dateClaims: getJwtDateClaims(payload)
      });
    } catch (error) {
      setResult({ kind: "error", message: error instanceof Error ? error.message : "Malformed JWT." });
    }
  }

  return (
    <>
      <section className="tool-controls">
        <label><FieldLabel>JWT</FieldLabel><textarea value={token} onChange={(event) => setToken(event.target.value)} spellCheck={false} /></label>
        <div className="button-row">
          <button className="primary-button" onClick={decodeToken} type="button">Decode token <span>→</span></button>
          <button className="ghost-button" onClick={() => { setToken(""); setResult({ kind: "idle", message: "Decode a JWT header and payload." }); }} type="button">Clear</button>
        </div>
        <p className="privacy-note"><span>●</span> Decoded locally. Signatures are not verified.</p>
      </section>
      <ResultPanel title="jwt.json" status={status}>
        {result.kind === "idle" && <p className="terminal-empty">$ {result.message}<span className="cursor" /></p>}
        {result.kind === "error" && <pre className="wrap-output">{result.message}</pre>}
        {result.kind === "success" && (
          <div className="stacked-output">
            <p className="result-note">Decoded only. This does not prove the token is valid, trusted, or unmodified.</p>
            <dl className="result-list">
              <div><dt>Signature segment</dt><dd>{result.hasSignature ? "Present, not verified" : "Not present"}</dd></div>
              {result.dateClaims.map((claim) => <div key={claim.name}><dt>{claim.name}</dt><dd>{claim.value} · {claim.local} local · {claim.utc} UTC</dd></div>)}
            </dl>
            <div>
              <h3 className="output-heading">Header</h3>
              <pre className="wrap-output compact-pre">{JSON.stringify(result.header, null, 2)}</pre>
            </div>
            <div>
              <h3 className="output-heading">Payload</h3>
              <pre className="wrap-output compact-pre">{JSON.stringify(result.payload, null, 2)}</pre>
            </div>
          </div>
        )}
      </ResultPanel>
    </>
  );
}

const REGEX_FLAGS = ["g", "i", "m", "s", "u", "y"] as const;

type RegexMatchInfo = {
  index: number;
  text: string;
  captures: string[];
  groups: Array<[string, string]>;
};

type RegexResult =
  | { kind: "idle"; message: string }
  | { kind: "error"; message: string }
  | { kind: "success"; matches: RegexMatchInfo[]; limited: boolean };

function RegexTester() {
  const [pattern, setPattern] = useState("(?<word>buffer)\\.(lol)");
  const [flags, setFlags] = useState("gi");
  const [text, setText] = useState("buffer.lol makes buffer.LOL easier to inspect.");
  const result = useMemo(() => testRegex(pattern, flags, text), [flags, pattern, text]);
  const status = result.kind === "error" ? "error" : result.kind === "idle" ? "idle" : "success";

  function toggleFlag(flag: string) {
    setFlags((current) => current.includes(flag) ? current.replace(flag, "") : `${current}${flag}`);
  }

  return (
    <>
      <section className="tool-controls">
        <label><FieldLabel>Pattern</FieldLabel><input value={pattern} onChange={(event) => setPattern(event.target.value)} spellCheck={false} /></label>
        <div>
          <FieldLabel>Flags</FieldLabel>
          <div className="flag-grid" role="group" aria-label="Regular expression flags">
            {REGEX_FLAGS.map((flag) => (
              <button className={flags.includes(flag) ? "flag-toggle is-active" : "flag-toggle"} key={flag} onClick={() => toggleFlag(flag)} type="button">{flag}</button>
            ))}
          </div>
        </div>
        <label><FieldLabel>Test text</FieldLabel><textarea value={text} onChange={(event) => setText(event.target.value)} spellCheck={false} /></label>
        <div className="button-row">
          <button className="ghost-button" onClick={() => { setPattern(""); setFlags("g"); setText(""); }} type="button">Clear</button>
        </div>
        <p className="privacy-note"><span>●</span> Regexes run locally using JavaScript RegExp.</p>
      </section>
      <ResultPanel title="regex.matches" status={status}>
        {result.kind === "idle" && <p className="terminal-empty">$ {result.message}<span className="cursor" /></p>}
        {result.kind === "error" && <pre className="wrap-output">{result.message}</pre>}
        {result.kind === "success" && (
          <div className="stacked-output">
            <p className="result-note">{result.matches.length ? `${result.matches.length}${result.limited ? "+" : ""} match${result.matches.length === 1 ? "" : "es"} found.` : "No matches found."}</p>
            <ol className="match-list">
              {result.matches.map((match, index) => (
                <li key={`${match.index}-${index}`}>
                  <dl className="result-list">
                    <div><dt>Index</dt><dd>{match.index}</dd></div>
                    <div><dt>Match</dt><dd>{match.text || "(empty match)"}</dd></div>
                    <div><dt>Captures</dt><dd>{match.captures.length ? match.captures.join(", ") : "None"}</dd></div>
                    <div><dt>Named groups</dt><dd>{match.groups.length ? match.groups.map(([name, value]) => `${name}: ${value}`).join(", ") : "None"}</dd></div>
                  </dl>
                </li>
              ))}
            </ol>
          </div>
        )}
      </ResultPanel>
    </>
  );
}

type CidrResult =
  | { kind: "idle"; message: string }
  | { kind: "error"; message: string }
  | { kind: "success"; rows: Array<[string, string]>; note: string };

type BackendEnvelope = {
  data?: unknown;
  error?: string;
  durationMs?: number;
  requestId?: string;
};

type BackendResult =
  | { kind: "idle"; message: string }
  | { kind: "pending" }
  | { kind: "error"; message: string; requestId?: string; durationMs?: number }
  | { kind: "success"; data: unknown; requestId?: string; durationMs?: number };

function CidrCalculator() {
  const [input, setInput] = useState("192.168.1.0/24");
  const [result, setResult] = useState<CidrResult>({ kind: "idle", message: "Calculate an IPv4 CIDR range." });
  const status = result.kind === "error" ? "error" : result.kind === "idle" ? "idle" : "success";

  function calculate() {
    try {
      setResult(calculateCidr(input));
    } catch (error) {
      setResult({ kind: "error", message: error instanceof Error ? error.message : "Invalid IPv4 CIDR." });
    }
  }

  return (
    <>
      <section className="tool-controls">
        <label><FieldLabel>IPv4 CIDR</FieldLabel><input value={input} onChange={(event) => setInput(event.target.value)} placeholder="192.168.1.0/24" spellCheck={false} /></label>
        <div className="button-row">
          <button className="primary-button" onClick={calculate} type="button">Calculate <span>→</span></button>
          <button className="ghost-button" onClick={() => { setInput(""); setResult({ kind: "idle", message: "Calculate an IPv4 CIDR range." }); }} type="button">Clear</button>
        </div>
        <p className="privacy-note"><span>●</span> IPv4 math runs locally with unsigned 32-bit arithmetic.</p>
      </section>
      <ResultPanel title="cidr.output" status={status}>
        {result.kind === "idle" && <p className="terminal-empty">$ {result.message}<span className="cursor" /></p>}
        {result.kind === "error" && <pre className="wrap-output">{result.message}</pre>}
        {result.kind === "success" && (
          <>
            <p className="result-note">{result.note}</p>
            <dl className="result-list">{result.rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
          </>
        )}
      </ResultPanel>
    </>
  );
}

function BackendPlaceholder({ tool }: { tool: Tool }) {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<BackendResult>({ kind: "idle", message: "Waiting for input." });
  const status = result.kind === "success" ? "success" : result.kind === "error" ? "error" : result.kind === "pending" ? "pending" : "idle";
  const isLiveBackendTool = tool.status === "available";

  async function runBackendRequest(event: React.FormEvent) {
    event.preventDefault();
    setResult({ kind: "pending" });

    try {
      const response = await fetch(`/api/tools/${tool.slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input })
      });
      const payload = await response.json() as BackendEnvelope;

      if (!response.ok || payload.error) {
        setResult({
          kind: "error",
          message: payload.error || `Request failed with HTTP ${response.status}.`,
          durationMs: payload.durationMs,
          requestId: payload.requestId
        });
        return;
      }

      setResult({
        kind: "success",
        data: payload.data,
        durationMs: payload.durationMs,
        requestId: payload.requestId
      });
    } catch (error) {
      setResult({
        kind: "error",
        message: error instanceof Error ? error.message : "The backend request failed."
      });
    }
  }

  return (
    <>
      <form className="tool-controls" onSubmit={runBackendRequest}>
        <div className={isLiveBackendTool ? "backend-banner is-live" : "backend-banner"}>
          <span>{isLiveBackendTool ? "Server check" : "Backend required"}</span>
          <p>{isLiveBackendTool ? "This tool runs through the same-origin diagnostics API." : "This tool needs a container or VM worker before it can return live network data."}</p>
        </div>
        <label>
          <FieldLabel>{tool.inputLabel || "Target"}</FieldLabel>
          <input value={input} onChange={(event) => setInput(event.target.value)} placeholder={tool.inputPlaceholder} disabled={tool.slug === "my-ip"} required={tool.slug !== "my-ip"} />
        </label>
        <div className="button-row"><button className="primary-button" disabled={result.kind === "pending"} type="submit">{result.kind === "pending" ? "Checking…" : tool.slug === "my-ip" ? "Detect my IP" : "Run check"} <span>→</span></button></div>
        <p className="helper-text">{isLiveBackendTool ? "Targets are validated server-side before any outbound request is made." : "Use the planned worker deployment for ICMP and traceroute support."}</p>
      </form>
      <ResultPanel title={`${tool.slug}.output`} status={status}>
        {result.kind === "idle" && <p className="terminal-empty"><span className="prompt">$</span> {result.message}<span className="cursor" /></p>}
        {result.kind === "pending" && <div className="loading-lines" aria-label="Loading"><span /><span /><span /></div>}
        {result.kind === "error" && (
          <div className="backend-result">
            <span>ERROR</span>
            <h3>Request did not complete</h3>
            <p>{result.message}</p>
            {result.requestId && <code>requestId: {result.requestId} · {result.durationMs}ms</code>}
          </div>
        )}
        {result.kind === "success" && (
          <div className="stacked-output">
            <p className="result-note">Completed in {result.durationMs}ms{result.requestId ? ` · ${result.requestId}` : ""}</p>
            {renderBackendData(tool.slug, result.data)}
          </div>
        )}
      </ResultPanel>
    </>
  );
}

function renderBackendData(slug: string, data: unknown) {
  const record = isRecord(data) ? data : null;

  if ((slug === "ping" || slug === "packet-loss") && record) {
    return <PingResult data={record} showSamples={slug === "packet-loss"} />;
  }

  if (slug === "traceroute" && record) {
    return <TracerouteResult data={record} />;
  }

  return <pre className="wrap-output compact-pre">{JSON.stringify(data, null, 2)}</pre>;
}

function PingResult({ data, showSamples }: { data: Record<string, unknown>; showSamples: boolean }) {
  const replies = Array.isArray(data.replies) ? data.replies.filter(isRecord) : [];
  const transmitted = formatUnknown(data.transmitted);
  const received = formatUnknown(data.received);
  const packetLoss = typeof data.packetLossPercent === "number" ? `${data.packetLossPercent}%` : formatUnknown(data.packetLossPercent);
  const rtt = [data.minMs, data.avgMs, data.maxMs]
    .map((value) => typeof value === "number" ? `${value}ms` : null)
    .filter(Boolean)
    .join(" / ");

  return (
    <>
      <dl className="result-list">
        <div><dt>Target</dt><dd>{formatUnknown(data.target)}</dd></div>
        <div><dt>Resolved address</dt><dd>{formatUnknown(data.resolvedAddress)}</dd></div>
        {showSamples && <div><dt>Samples</dt><dd>{formatUnknown(data.samples)}</dd></div>}
        <div><dt>Packets</dt><dd>{transmitted} transmitted · {received} received</dd></div>
        <div><dt>Packet loss</dt><dd>{packetLoss}</dd></div>
        <div><dt>RTT min / avg / max</dt><dd>{rtt || "No round-trip timing returned"}</dd></div>
      </dl>
      {replies.length > 0 && (
        <ol className="inline-result-list diagnostic-replies">
          {replies.map((reply, index) => (
            <li key={`${formatUnknown(reply.sequence)}-${index}`}>
              <strong>seq {formatUnknown(reply.sequence)}</strong>
              <span>{formatUnknown(reply.timeMs)}ms</span>
            </li>
          ))}
        </ol>
      )}
      {typeof data.raw === "string" && <RawOutput value={data.raw} />}
    </>
  );
}

function TracerouteResult({ data }: { data: Record<string, unknown> }) {
  const hops = Array.isArray(data.hops) ? data.hops.filter(isRecord) : [];

  return (
    <>
      <dl className="result-list">
        <div><dt>Target</dt><dd>{formatUnknown(data.target)}</dd></div>
        <div><dt>Resolved address</dt><dd>{formatUnknown(data.resolvedAddress)}</dd></div>
        <div><dt>Reached target</dt><dd>{data.reached === true ? "Yes" : data.reached === false ? "No" : "Unknown"}</dd></div>
      </dl>
      <ol className="trace-list">
        {hops.map((hop, index) => (
          <li key={`${formatUnknown(hop.hop)}-${index}`} className={hop.timeout ? "is-timeout" : ""}>
            <span>{formatUnknown(hop.hop).padStart(2, "0")}</span>
            <strong>{hop.timeout ? "Timed out" : formatUnknown(hop.address)}</strong>
            <em>{typeof hop.rttMs === "number" ? `${hop.rttMs}ms` : "*"}</em>
          </li>
        ))}
      </ol>
      {typeof data.raw === "string" && <RawOutput value={data.raw} />}
    </>
  );
}

function RawOutput({ value }: { value: string }) {
  return (
    <details className="raw-output">
      <summary>Raw command output</summary>
      <pre className="wrap-output compact-pre">{value}</pre>
    </details>
  );
}

function formatUnknown(value: unknown) {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "Unknown";
}

function toUrlResult(url: URL, assumedProtocol: boolean): UrlResult {
  return {
    kind: "url",
    assumedProtocol,
    fields: [
      ["Protocol", url.protocol],
      ["Hostname", url.hostname],
      ["Port", url.port],
      ["Pathname", url.pathname],
      ["Hash", url.hash],
      ["Origin", url.origin],
      ["Full href", url.href]
    ],
    params: Array.from(url.searchParams.entries())
  };
}

function decodeJwtSegment(segment: string): unknown {
  const base64 = segment.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  const decoded = new TextDecoder("utf-8", { fatal: true }).decode(bytes);

  return JSON.parse(decoded);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getJwtDateClaims(payload: Record<string, unknown>): JwtDateClaim[] {
  return ["exp", "nbf", "iat"].flatMap((name) => {
    const rawValue = payload[name];
    const value = typeof rawValue === "number" || typeof rawValue === "string" ? Number(rawValue) : Number.NaN;

    if (!Number.isFinite(value)) {
      return [];
    }

    const date = new Date(value * 1000);

    if (Number.isNaN(date.getTime())) {
      return [];
    }

    return [{ name, value, local: date.toLocaleString(), utc: date.toISOString() }];
  });
}

function testRegex(pattern: string, flags: string, text: string): RegexResult {
  if (!pattern) {
    return { kind: "idle", message: "Enter a pattern to test." };
  }

  try {
    const regex = new RegExp(pattern, flags);

    if (regex.global) {
      const allMatches = Array.from(text.matchAll(regex));
      return {
        kind: "success",
        matches: allMatches.slice(0, 100).map(toRegexMatchInfo),
        limited: allMatches.length > 100
      };
    }

    const match = regex.exec(text);

    return {
      kind: "success",
      matches: match ? [toRegexMatchInfo(match)] : [],
      limited: false
    };
  } catch (error) {
    return { kind: "error", message: error instanceof Error ? error.message : "Invalid regular expression." };
  }
}

function toRegexMatchInfo(match: RegExpMatchArray): RegexMatchInfo {
  return {
    index: match.index ?? 0,
    text: match[0],
    captures: match.slice(1).map((value) => value ?? "(undefined)"),
    groups: Object.entries(match.groups ?? {}).map(([name, value]) => [name, value ?? "(undefined)"])
  };
}

function calculateCidr(input: string): CidrResult {
  const match = input.trim().match(/^(\d{1,3}(?:\.\d{1,3}){3})\/(\d{1,2})$/);

  if (!match) {
    throw new Error("Use IPv4 CIDR notation like 192.168.1.0/24.");
  }

  const prefix = Number(match[2]);

  if (!Number.isInteger(prefix) || prefix < 0 || prefix > 32) {
    throw new Error("Prefix length must be between 0 and 32.");
  }

  const ip = ipToInt(match[1]);
  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  const wildcard = (~mask) >>> 0;
  const network = (ip & mask) >>> 0;
  const broadcast = (network | wildcard) >>> 0;
  const total = 2 ** (32 - prefix);
  const usable = prefix < 31 ? total - 2 : total;
  const firstUsable = prefix < 31 ? network + 1 : network;
  const lastUsable = prefix < 31 ? broadcast - 1 : broadcast;
  const note = prefix === 31
    ? "/31 is treated as a point-to-point range with 2 usable addresses and no traditional network/broadcast host pair."
    : prefix === 32
      ? "/32 is a single host route."
      : "Traditional IPv4 network and broadcast addresses are excluded from usable host count.";

  return {
    kind: "success",
    note,
    rows: [
      ["Input address", intToIp(ip)],
      ["Prefix length", `/${prefix}`],
      ["Network address", intToIp(network)],
      ["Broadcast address", intToIp(broadcast)],
      ["Subnet mask", intToIp(mask)],
      ["Wildcard mask", intToIp(wildcard)],
      ["First usable host", intToIp(firstUsable)],
      ["Last usable host", intToIp(lastUsable)],
      ["Total addresses", total.toLocaleString()],
      ["Usable host count", usable.toLocaleString()]
    ]
  };
}

function ipToInt(ipAddress: string) {
  const octets = ipAddress.split(".").map(Number);

  if (octets.length !== 4 || octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)) {
    throw new Error("IPv4 octets must be numbers from 0 through 255.");
  }

  return (((octets[0] << 24) >>> 0) + (octets[1] << 16) + (octets[2] << 8) + octets[3]) >>> 0;
}

function intToIp(value: number) {
  return [24, 16, 8, 0].map((shift) => String((value >>> shift) & 255)).join(".");
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
