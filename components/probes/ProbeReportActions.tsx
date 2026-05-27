"use client";

import { useState } from "react";

type ProbeReportActionsProps = {
  reportText: string;
  url: string;
  probeType: "hls" | "dash";
  region: string;
};

export function ProbeReportActions({ reportText, url, probeType, region }: ProbeReportActionsProps) {
  const [message, setMessage] = useState("");
  const [isRerunning, setIsRerunning] = useState(false);

  async function copyReport() {
    try {
      await navigator.clipboard.writeText(reportText);
      setMessage("Report copied.");
    } catch {
      setMessage("Copy failed. Select the report text manually.");
    }
  }

  async function rerunProbe() {
    setIsRerunning(true);
    setMessage("Queueing rerun...");
    try {
      const response = await fetch("/api/probes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, probeType, region })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Could not queue rerun.");
      window.location.assign(`/app/probes/${payload.probeId}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not queue rerun.");
      setIsRerunning(false);
    }
  }

  return (
    <div className="report-actions">
      <button className="submit-btn report-action-button" type="button" onClick={copyReport}>
        <span>Copy report</span>
        <CopyIcon />
      </button>
      <button className="submit-btn report-action-button report-action-secondary" type="button" onClick={rerunProbe} disabled={isRerunning}>
        <span>{isRerunning ? "Queueing..." : "Rerun probe"}</span>
        <RefreshIcon />
      </button>
      <a className="submit-btn report-action-button report-action-secondary" href={url} target="_blank" rel="noreferrer">
        <span>Open URL</span>
        <ExternalIcon />
      </a>
      <p className="form-feedback" role="status" aria-live="polite">{message}</p>
    </div>
  );
}

function CopyIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 8h10v12H8z" />
      <path d="M6 16H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20 11a8.1 8.1 0 0 0-15.5-2M4 5v4h4" />
      <path d="M4 13a8.1 8.1 0 0 0 15.5 2M20 19v-4h-4" />
    </svg>
  );
}

function ExternalIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M14 5h5v5" />
      <path d="m10 14 9-9" />
      <path d="M19 14v4a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h4" />
    </svg>
  );
}
