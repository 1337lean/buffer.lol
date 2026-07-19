import { ipLensConfig } from "@/data/ip-lens";

export function AppStoreCTA({ className = "primary-button" }: { className?: string }) {
  if (ipLensConfig.appStoreUrl) {
    return (
      <a
        className={`${className} app-store-cta`}
        href={ipLensConfig.appStoreUrl}
        rel="noreferrer"
        target="_blank"
        aria-label={`View ${ipLensConfig.appName} on the App Store`}
      >
        <span>View on the App Store</span>
        <small aria-hidden="true">↗</small>
      </a>
    );
  }

  return (
    <button
      className={`${className} app-store-cta is-disabled`}
      type="button"
      disabled
      aria-label={`View ${ipLensConfig.appName} on the App Store — ${ipLensConfig.releaseStatus}`}
    >
      <span>View on the App Store</span>
      <small>{ipLensConfig.releaseStatus}</small>
    </button>
  );
}
