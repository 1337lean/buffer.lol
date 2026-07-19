import Image from "next/image";
import type { IPLensScreenshot } from "@/data/ip-lens";

export function AppScreenshotFrame({
  screenshot,
  featured = false
}: {
  screenshot: IPLensScreenshot;
  featured?: boolean;
}) {
  return (
    <figure className={`app-screenshot-frame${featured ? " is-featured" : ""}`}>
      <div className="app-device-shell">
        {!screenshot.src && <span className="app-device-speaker" aria-hidden="true" />}
        {screenshot.src ? (
          <Image
            src={screenshot.src}
            alt={screenshot.alt}
            width={screenshot.width}
            height={screenshot.height}
            sizes={featured ? "(max-width: 960px) 86vw, 390px" : "(max-width: 700px) 72vw, 260px"}
          />
        ) : (
          <div className="app-screenshot-placeholder" role="img" aria-label={screenshot.alt}>
            <span className="placeholder-command">{screenshot.command}</span>
            <div>
              <small>Screenshot slot</small>
              <strong>{screenshot.label}</strong>
              <p>Add the final app capture in <code>/public/ip-lens/screenshots</code>.</p>
            </div>
            <span className="placeholder-status"><i aria-hidden="true" /> Ready for artwork</span>
          </div>
        )}
      </div>
      <figcaption><span>{screenshot.command}</span>{screenshot.label}</figcaption>
    </figure>
  );
}
