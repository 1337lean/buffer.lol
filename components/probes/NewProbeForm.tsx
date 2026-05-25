"use client";

import { FormEvent, useState } from "react";

const regions = [
  ["us-east", "US East"],
  ["us-west", "US West"],
  ["eu-west", "EU West"],
  ["apac", "APAC"]
];

const probeTypes = [
  ["hls", "HLS"],
  ["dash", "DASH"],
  ["mp4", "MP4"],
  ["upload", "Upload"]
];

export function NewProbeForm() {
  const [url, setUrl] = useState("https://demo.buffer.lol/live/master.m3u8");
  const [probeType, setProbeType] = useState("hls");
  const [region, setRegion] = useState("us-east");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("Queueing probe...");

    try {
      const response = await fetch("/api/probes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, probeType, region })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Could not queue probe.");
      window.location.assign(`/app/probes/${payload.probeId}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not queue probe.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="probe-panel product-form" onSubmit={onSubmit}>
      <label htmlFor="new-probe-url">Stream or upload URL</label>
      <input id="new-probe-url" type="url" value={url} onChange={(event) => setUrl(event.target.value)} required />
      <div className="probe-controls">
        <label>
          <span>Probe type</span>
          <select value={probeType} onChange={(event) => setProbeType(event.target.value)}>
            {probeTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label>
          <span>Region</span>
          <select value={region} onChange={(event) => setRegion(event.target.value)}>
            {regions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
      </div>
      <button className="submit-btn probe-submit" type="submit" disabled={isSubmitting}>
        <span>{isSubmitting ? "Queueing..." : "Queue probe"}</span>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" /></svg>
      </button>
      <p className="form-feedback" role="status" aria-live="polite">{message}</p>
    </form>
  );
}
