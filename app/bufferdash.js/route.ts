const disabledLoader = "/* BufferDash disabled: BUFFERDASH_URL and BUFFERDASH_SITE_ID are required. */";

export const dynamic = "force-dynamic";

function trackerUrl() {
  const value = process.env.BUFFERDASH_URL;
  if (!value) return null;

  try {
    const url = new URL(value);
    const isLocalDevelopment = process.env.NODE_ENV !== "production" && url.protocol === "http:" && ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
    if (url.protocol !== "https:" && !isLocalDevelopment) return null;
    return `${url.toString().replace(/\/$/, "")}/tracker.js`;
  } catch {
    return null;
  }
}

export function GET() {
  const src = trackerUrl();
  const siteId = process.env.BUFFERDASH_SITE_ID;

  if (!src || !siteId || siteId.length > 128 || !/^[a-zA-Z0-9._-]+$/.test(siteId)) {
    return new Response(disabledLoader, {
      headers: {
        "content-type": "application/javascript; charset=utf-8",
        "cache-control": "no-store"
      }
    });
  }

  const loader = `
(function () {
  var script = document.createElement("script");
  script.defer = true;
  script.src = ${JSON.stringify(src)};
  script.setAttribute("data-site-id", ${JSON.stringify(siteId)});
  document.head.appendChild(script);
})();`;

  return new Response(loader, {
    headers: {
      "content-type": "application/javascript; charset=utf-8",
      "cache-control": "public, max-age=300, stale-while-revalidate=3600"
    }
  });
}
