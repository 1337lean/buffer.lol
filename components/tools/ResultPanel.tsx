import type { ReactNode } from "react";

type ResultPanelProps = {
  title?: string;
  status?: "idle" | "success" | "error" | "pending";
  children: ReactNode;
};

export function ResultPanel({ title = "output.log", status = "idle", children }: ResultPanelProps) {
  return (
    <section className="result-panel" aria-live="polite">
      <div className="terminal-bar">
        <span className="terminal-dots" aria-hidden="true"><i /><i /><i /></span>
        <strong>{title}</strong>
        <span className={`terminal-status status-${status}`}>{status}</span>
      </div>
      <div className="result-body">{children}</div>
    </section>
  );
}
