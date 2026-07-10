"use client";

import { useRef } from "react";
import type { PointerEvent } from "react";

export function HeroTerminal() {
  const terminalRef = useRef<HTMLDivElement>(null);

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const terminal = terminalRef.current;
    if (!terminal) return;

    const rect = terminal.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;

    terminal.style.setProperty("--tilt-x", `${(-y * 5).toFixed(2)}deg`);
    terminal.style.setProperty("--tilt-y", `${(x * 6).toFixed(2)}deg`);
  }

  function resetTilt() {
    const terminal = terminalRef.current;
    if (!terminal) return;

    terminal.style.setProperty("--tilt-x", "0deg");
    terminal.style.setProperty("--tilt-y", "0deg");
  }

  return (
    <div
      ref={terminalRef}
      className="hero-terminal"
      aria-label="buffer.lol terminal preview"
      onPointerMove={handlePointerMove}
      onPointerLeave={resetTilt}
      onPointerCancel={resetTilt}
    >
      <div className="terminal-bar"><span className="terminal-dots"><i /><i /><i /></span><strong>buffer — zsh</strong><span className="terminal-status status-success">ready</span></div>
      <div className="hero-terminal-body">
        <p><span className="prompt">➜</span> <i>~</i> buffer latency --samples 2</p>
        <p className="muted-line">Sampling HTTPS round trips<span className="typing-dots">...</span></p>
        <p><b>sample 1</b> buffer.lol: time=<em>18.4 ms</em></p>
        <p><b>sample 2</b> buffer.lol: time=<em>17.9 ms</em></p>
        <div className="terminal-rule" />
        <p><span className="success-mark">✓</span> 2 requests completed · <em>0 failures</em></p>
        <p className="terminal-prompt"><span className="prompt">➜</span> <i>~</i> <span className="cursor" /></p>
      </div>
      <div className="terminal-foot"><span><i /> encrypted connection</span><span>v1.0</span></div>
    </div>
  );
}
