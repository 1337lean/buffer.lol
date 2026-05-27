"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    initBufferLol?: () => void;
  }
}

export function LandingEnhancements() {
  useEffect(() => {
    let cancelled = false;

    function runInitializer() {
      window.requestAnimationFrame(() => {
        if (!cancelled) window.initBufferLol?.();
      });
    }

    if (window.initBufferLol) {
      runInitializer();
    } else {
      const existingScript = document.querySelector<HTMLScriptElement>("script[data-buffer-lol-enhancements]");
      const script = existingScript ?? document.createElement("script");
      script.dataset.bufferLolEnhancements = "true";
      script.src = "/app.js";
      script.async = true;
      script.addEventListener("load", runInitializer, { once: true });
      if (!existingScript) document.body.appendChild(script);
    }

    window.addEventListener("hashchange", runInitializer);
    return () => {
      cancelled = true;
      window.removeEventListener("hashchange", runInitializer);
    };
  }, []);

  return null;
}
