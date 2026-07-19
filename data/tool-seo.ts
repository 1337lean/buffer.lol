import type { ToolSeo, ToolSeoFaq } from "./tools";

type SeoInput = {
  title: string;
  metaDescription: string;
  intro: string;
  how: string;
  read: string;
  limits: string;
  faq: ToolSeoFaq[];
};

function seo(input: SeoInput): ToolSeo {
  return {
    title: input.title,
    metaDescription: input.metaDescription,
    updatedAt: "2026-07-19",
    intro: input.intro,
    sections: [
      { heading: "How to use this tool", paragraphs: [input.how] },
      { heading: "How to read the result", paragraphs: [input.read] },
      { heading: "Limits and privacy", paragraphs: [input.limits] }
    ],
    faq: input.faq
  };
}

export const toolSeoContent: Record<string, ToolSeo> = {
  ping: seo({
    title: "Browser Latency Test",
    metaDescription: "Test browser latency to buffer.lol with repeated HTTPS round trips and review minimum, average, maximum, failed requests, and jitter.",
    intro: "This browser latency test measures the time required for small HTTPS requests to travel from your browser to buffer.lol and back. It is useful for a quick view of the delay affecting web requests on your current connection, without requiring ICMP access or software installation.",
    how: "Select Test latency to run a short series of requests from this tab. Keep the tab active and pause large downloads, video calls, or VPN changes if you want a cleaner baseline. Run the test again at different times or on another connection when comparing Wi-Fi, Ethernet, cellular service, or VPN routing. Because the requests originate in your browser, the result includes browser, TLS connection, internet route, and server response overhead.",
    read: "Minimum, average, and maximum values summarize successful round trips in milliseconds. Lower latency generally makes interactive browsing feel more responsive. Jitter is the average change between consecutive samples; a large gap between minimum and maximum values or elevated jitter can indicate an inconsistent connection. Failed requests show samples that timed out or returned an error. Compare repeated runs instead of treating one sample as a permanent rating of the connection.",
    limits: "This is an HTTPS latency test to buffer.lol, not an ICMP ping to an arbitrary host. Results will differ from command-line ping because browsers cannot send raw ICMP packets. Server distance, DNS and connection reuse, browser scheduling, VPNs, Wi-Fi interference, and temporary congestion can all affect the measurement. The test sends only the requests needed to collect the samples; no account is required.",
    faq: [
      { question: "Is this the same as command-line ping?", answer: "No. It measures HTTPS round trips from the browser. Command-line ping normally uses ICMP, so its timing and network treatment can differ." },
      { question: "What is a good browser latency result?", answer: "There is no universal cutoff. Consistently low values with little jitter are preferable, but the most useful comparison is between repeated tests from the same location and device." }
    ]
  }),
  "packet-loss": seo({
    title: "Connection Stability and Packet Loss Test",
    metaDescription: "Check connection stability from your browser with repeated HTTPS samples, failed-request percentage, latency range, and jitter.",
    intro: "The connection stability test sends repeated HTTPS requests from this browser and summarizes completed requests, failures, latency, and jitter. It can reveal intermittent behavior that a single speed or latency measurement may miss.",
    how: "Start the test while using the connection you want to evaluate. Leave this tab open until every sample finishes and avoid switching networks during the run. If you are troubleshooting an intermittent problem, repeat the test near and far from the Wi-Fi access point, with and without a VPN, or at different times of day. Those controlled comparisons are more informative than one isolated percentage.",
    read: "The failed-request percentage is the share of browser samples that did not complete successfully. Jitter describes variation between successful round-trip times, while minimum, average, and maximum latency show the observed range. Zero failed requests with a narrow latency range suggests a stable path during the sample window. A few failures or large timing spikes may warrant a longer test with dedicated network software before drawing a conclusion.",
    limits: "Browsers cannot observe IP-layer packet loss directly, so this tool reports failed HTTPS requests rather than raw packet loss from ICMP or UDP probes. Application errors, browser scheduling, server availability, and connection setup can influence the result. It is a short on-demand diagnostic, not continuous monitoring and not proof of an ISP fault. Requests are sent only to buffer.lol for the duration of the test.",
    faq: [
      { question: "Does a failed request always mean a dropped network packet?", answer: "No. A timeout or HTTP failure can occur above the packet layer. The result is best described as browser-request loss or instability." },
      { question: "Why should I run the test more than once?", answer: "Interference and congestion change over time. Repeated tests help distinguish a recurring pattern from a brief spike." }
    ]
  }),
  traceroute: seo({
    title: "Online Traceroute Visualizer",
    metaDescription: "Run an online traceroute from the buffer.lol diagnostics server and inspect responding network hops, timing, and route gaps.",
    intro: "Traceroute maps the responding hops between the buffer.lol diagnostics server and a public destination. It helps illustrate the route seen from the server side and where latency changes or non-responsive hops appear along that path.",
    how: "Enter a public hostname or IP address and run the trace. The request is validated before it reaches the restricted diagnostics worker. Read the hops in order from the worker toward the destination, and repeat the trace if you are investigating a transient route. A hostname trace may resolve to a different address over time because of DNS load balancing, anycast, or content delivery networks.",
    read: "Each numbered row represents a hop that returned a traceroute response. Addresses or resolved names can identify networks along the path, while timing values approximate the response delay for that probe. Asterisks or missing hops do not automatically indicate failure: routers often filter or deprioritize traceroute traffic while continuing to forward ordinary traffic. A persistent jump that continues through later hops is more meaningful than one slow intermediate response.",
    limits: "The trace begins at buffer.lol's server, not at your browser, home router, or office network. It therefore cannot diagnose the first mile of your own connection. Routes can be asymmetric, and the return path may differ from the displayed outbound path. Firewall rules, MPLS, tunnels, load balancing, and ICMP filtering can hide or rearrange details. Use only destinations you are authorized to inspect; submitted targets are processed by the diagnostics service.",
    faq: [
      { question: "Why do some traceroute hops show no response?", answer: "Many routers filter or rate-limit traceroute replies. A missing intermediate response does not mean the router stopped forwarding normal traffic." },
      { question: "Does this show the route from my device?", answer: "No. It shows the route from the buffer.lol diagnostics server to the destination." }
    ]
  }),
  "dns-lookup": seo({
    title: "Free DNS Lookup Tool",
    metaDescription: "Look up A, AAAA, MX, TXT, CNAME, and NS records for a domain with a fast, free online DNS record checker.",
    intro: "Use this DNS lookup tool to inspect the records currently returned for a public domain. It queries common address, mail, text, alias, and authoritative nameserver record types in one request, making it useful for deployment checks and basic DNS troubleshooting.",
    how: "Enter a domain name such as example.com without a path or query string, then run the lookup. The tool requests A, AAAA, MX, TXT, CNAME, and NS answers and groups the returned values by type. For a recently changed record, compare the result with the value configured at your authoritative DNS provider and allow for the record's previous TTL. Use the resolver comparison tool when you specifically need to compare answers across several public resolvers.",
    read: "A and AAAA records map names to IPv4 and IPv6 addresses. CNAME records point one hostname at another canonical name. MX records identify mail exchangers and include preference values, where lower numbers are normally tried first. NS records identify authoritative nameservers, and TXT records carry arbitrary text used by services such as SPF and domain verification. An empty answer for one type can be valid; not every domain publishes every kind of record.",
    limits: "DNS answers are a point-in-time view and can vary because of caching, geography, split-horizon DNS, load balancing, or resolver policy. A successful lookup does not prove that the associated web or mail service is reachable. The submitted domain is sent to the same-origin buffer.lol API and processed only to return the requested records. Do not submit internal or sensitive hostnames.",
    faq: [
      { question: "Why does the lookup show an old DNS value?", answer: "Recursive resolvers may cache the previous answer until its TTL expires. Different resolvers can update at different times after a change." },
      { question: "What does an empty record section mean?", answer: "It usually means no answer of that type was published for the queried name. It does not necessarily mean the domain is broken." }
    ]
  }),
  "http-headers": seo({
    title: "HTTP Header Inspector",
    metaDescription: "Inspect HTTP response headers, status, redirects, caching directives, content type, and server details for a public URL.",
    intro: "The HTTP header inspector requests a public web URL and displays the response metadata returned by the server. It is a quick way to check status, redirects, caching, content negotiation, and server behavior without opening browser developer tools.",
    how: "Enter a complete public URL, including https:// when appropriate, and run the check. Review the final status and the normalized response headers. Test the exact path involved in a problem because headers can differ between the homepage, assets, API routes, and error pages. If redirects are central to the issue, use the redirect checker to view each step rather than only the resulting response.",
    read: "The status code describes the response class, such as success, redirect, client error, or server error. Content-Type identifies the returned media type. Cache-Control, Expires, Age, ETag, and Last-Modified influence caching and revalidation. Location identifies a redirect target. Vary tells caches which request headers affect the representation. Server and related headers may describe the serving stack, although they can be removed, generalized, or supplied by a proxy.",
    limits: "The request originates from buffer.lol's server and may receive different content than your browser because of geography, cookies, authentication, user agent handling, or bot protection. Response headers alone do not establish that a site is secure. The API blocks private and reserved network targets, limits redirects and response size, and validates resolved addresses to reduce server-side request forgery risk. Submitted public URLs are processed to perform the check.",
    faq: [
      { question: "Why are these headers different from my browser's headers?", answer: "The server-side request has a different location, user agent, cookies, and cache state. Sites can vary responses using any of those signals." },
      { question: "Can this inspect request headers?", answer: "This page focuses on the response headers returned by the target. It does not reproduce your browser's authenticated request." }
    ]
  }),
  "ssl-checker": seo({
    title: "SSL Certificate Checker",
    metaDescription: "Check a website's TLS certificate, validity dates, issuer, subject names, protocol, and days remaining before expiration.",
    intro: "The SSL certificate checker opens a TLS connection to a public hostname and summarizes the certificate presented by that endpoint. Use it to confirm names, issuer, validity dates, protocol details, and the remaining time before expiration.",
    how: "Enter a hostname without a URL path and run the check. Use the exact hostname visitors connect to, because example.com and www.example.com can terminate TLS separately. Compare the reported subject alternative names with the requested hostname and confirm that the current time falls between the not-before and not-after dates. Recheck after a certificate renewal or load-balancer change to ensure the intended certificate is being served publicly.",
    read: "A valid certificate must be within its validity window and cover the requested hostname, normally through a Subject Alternative Name. The issuer identifies the certificate authority or intermediate that signed it. Days remaining helps plan renewal but does not confirm that automation will succeed. Protocol and cipher fields describe the negotiated connection from the checker. The serial number and fingerprint can help distinguish certificates during a rotation.",
    limits: "This is an external point-in-time connection from buffer.lol, so it cannot inspect certificates available only on private networks or behind client authentication. A successful handshake does not audit every supported TLS version, cipher, certificate-chain path, or browser. CDN and load-balanced endpoints may present different certificates by location. The submitted hostname is processed by the server-backed checker and private or reserved targets are rejected.",
    faq: [
      { question: "Does a valid certificate mean the website is secure?", answer: "No. It confirms aspects of the TLS identity and validity window, not the security of the application, server, or content." },
      { question: "Why does the checker show a different certificate than expected?", answer: "DNS, CDN routing, load balancing, SNI configuration, or an incomplete deployment can direct the checker to a different TLS endpoint." }
    ]
  }),
  uptime: seo({
    title: "Website Uptime Checker",
    metaDescription: "Check whether a public website is reachable now and inspect its HTTP status, response timing, and final URL after redirects.",
    intro: "This website uptime checker makes an on-demand request from buffer.lol's server and reports whether a public URL responds. It is designed for quick reachability checks when you need a second external viewpoint.",
    how: "Enter the complete page URL you want to test and run the check. Test the exact hostname and path affected by the incident, then compare it with a known public page on the same site. If the response redirects, note the final URL. Repeat the check after a configuration or deployment change, but use a monitoring service when you need scheduled probes, alerting, or a historical uptime percentage.",
    read: "A successful connection means the checker received an HTTP response; the status code still determines whether that response represents success, redirection, or an error. Response time includes DNS, connection, TLS, redirects, and server work observed by this request. A fast error page is still an outage from a visitor's perspective. Differences between this result and your browser can point toward regional, authentication, cache, or network-specific behavior.",
    limits: "One successful check does not prove continuous uptime, and one failed check does not prove a global outage. The request comes from a single server location and can be affected by bot protection, rate limits, DNS, transient routing, or the checker itself. Private addresses and internal hostnames are blocked. The submitted URL is processed only to perform the requested diagnostic; no account or continuous monitoring is created.",
    faq: [
      { question: "Does this calculate an uptime percentage?", answer: "No. It checks the URL now. A reliable uptime percentage requires scheduled measurements collected over a defined period." },
      { question: "Why is the site up for me but down for the checker?", answer: "Regional routing, DNS, firewall rules, bot protection, authentication, or cached browser content can make two viewpoints behave differently." }
    ]
  }),
  "port-checker": seo({
    title: "Open Port Checker",
    metaDescription: "Check whether a public TCP port is reachable from the internet by testing a hostname or IP address and port number.",
    intro: "The open port checker attempts a TCP connection from buffer.lol's server to a public host and port. It can confirm whether a service is reachable from an external network at the moment of the test.",
    how: "Enter a public hostname or IP address followed by a port, such as example.com:443. Confirm that the service is listening locally and that host, cloud, and perimeter firewalls allow the connection before testing. A successful result means the TCP handshake completed from the checker's network. For troubleshooting, compare the public hostname with its resolved address and verify any NAT or load-balancer forwarding rules.",
    read: "An open result means a TCP connection was established; it does not verify that the application protocol returned correct data. A refused result usually means the destination actively rejected the connection or nothing is listening. A timeout can indicate filtering, routing trouble, silent firewall policy, or an unreachable host. Because these outcomes can vary by source network, compare the result with tests from an authorized machine in another location when needed.",
    limits: "The checker supports TCP reachability, not UDP scanning, service fingerprinting, or broad port ranges. Private, loopback, link-local, multicast, and other reserved targets are rejected, and only a single user-supplied port is tested. Firewalls may allow buffer.lol while blocking other sources, or do the reverse. Only test systems you own or are authorized to assess; the target is sent to the server to make the connection.",
    faq: [
      { question: "Does an open port prove the service is working?", answer: "No. It proves only that a TCP handshake completed. The application behind the port can still be unhealthy or misconfigured." },
      { question: "Why does a port time out instead of showing closed?", answer: "Many firewalls silently drop connection attempts. That behavior produces a timeout rather than an immediate refusal." }
    ]
  }),
  "cidr-calculator": seo({
    title: "IPv4 CIDR Calculator",
    metaDescription: "Calculate an IPv4 CIDR network address, subnet mask, wildcard mask, address range, broadcast address, and host capacity locally.",
    intro: "The IPv4 CIDR calculator converts an address and prefix length into the boundaries and masks of its network. It performs the math in your browser and is useful when planning subnets, checking firewall ranges, or learning how CIDR notation divides IPv4 space.",
    how: "Enter an IPv4 address with a prefix such as 192.168.1.20/24. The host portion does not need to be zero; the calculator derives the containing network. Run the calculation to view the network address, broadcast address, subnet and wildcard masks, first and last addresses, and capacity. Treat /31 and /32 networks according to the protocol and device you are configuring, since their usable-address conventions differ from traditional multi-host subnets.",
    read: "The prefix length is the number of leading network bits. A larger prefix creates a smaller block: /24 contains 256 total addresses, while /25 contains 128. The network address is the first address in the block and the broadcast address is the last for conventional IPv4 subnetting. The subnet mask expresses network bits as dotted decimal, while the wildcard mask is its inverse and is often used in access-control syntax.",
    limits: "This calculator handles IPv4 only and uses unsigned 32-bit arithmetic locally in the tab. It does not validate whether a range is publicly routable, assigned to your organization, or appropriate for a particular vendor. Host-capacity rules depend on context, especially point-to-point /31 networks and single-host /32 routes. No entered CIDR value is sent to buffer.lol.",
    faq: [
      { question: "Can I enter a host address instead of the network address?", answer: "Yes. The calculator uses the prefix to find the containing network and its boundaries." },
      { question: "Why are /31 and /32 networks special?", answer: "A /31 can be used on point-to-point links without traditional network and broadcast reservations, while a /32 identifies one IPv4 address." }
    ]
  }),
  "whois-lookup": seo({
    title: "WHOIS and RDAP Lookup",
    metaDescription: "Look up public domain or IP registration details, registrar, status, nameservers, dates, and authoritative RDAP data.",
    intro: "The WHOIS lookup retrieves public registration information for a domain or IP address using RDAP where available. It can help identify the registrar or registry, registration status, important dates, nameservers, and the organization responsible for an address range.",
    how: "Enter a registered domain name or public IP address. Use the registrable domain rather than a full URL or arbitrary subdomain when checking domain ownership data. Review the returned events, statuses, entities, and nameservers, then follow the authoritative registry link when you need the original record. For an IP address, the result usually describes the allocated network block rather than the individual server or person using that address.",
    read: "Domain records can include creation, update, and expiration events; registrar and registry identifiers; transfer or deletion status codes; and delegated nameservers. IP records normally show a start and end address, handle, country or registry metadata, and responsible entities. Redaction is common under current privacy policies, so missing contact fields are not necessarily an error. Registration data describes administrative delegation, not proof of control over website content.",
    limits: "RDAP and legacy WHOIS sources vary by registry, data policy, rate limit, and update schedule. Dates and entity roles may be absent or formatted differently. Privacy services and legal redaction can hide personal details. The lookup cannot establish identity, ownership of content, or current operational control. Submitted public domains and addresses are processed by buffer.lol to query the applicable registration service; private and reserved IP targets are not accepted.",
    faq: [
      { question: "Why is registrant contact information hidden?", answer: "Registries and registrars commonly redact personal data or replace it with a privacy contact under their policies and applicable law." },
      { question: "Is RDAP the same as WHOIS?", answer: "RDAP is the newer structured registration-data protocol. It serves a similar purpose while providing standardized JSON responses and clearer referral behavior." }
    ]
  }),
  "redirect-checker": seo({
    title: "HTTP Redirect Checker",
    metaDescription: "Trace an HTTP redirect chain and inspect every status code, destination URL, redirect location, and response time.",
    intro: "The redirect checker follows a public URL through its HTTP redirect chain and displays each hop. It helps find unnecessary redirects, loops, incorrect destinations, and HTTP-to-HTTPS or hostname canonicalization problems.",
    how: "Enter the exact starting URL, including its protocol and path, then run the check. Review every hop from the original address to the final response. Test common variants such as http, https, apex, www, trailing slash, and legacy paths when auditing a migration. A clean permanent migration usually sends each old URL directly to its intended canonical replacement instead of passing through several generic redirects.",
    read: "301 and 308 normally communicate permanent moves, while 302, 303, and 307 represent temporary or request-handling redirects with different method rules. The Location header provides the next destination. The final status should be appropriate for the requested page, and the displayed final URL should agree with the page's canonical URL. Multiple hops add request latency and create more points where query strings, paths, or tracking parameters can be lost.",
    limits: "The chain is observed by a server-side request without your browser's cookies, authentication, cache, or JavaScript execution. Client-side redirects produced only by JavaScript or some meta refresh behavior may not appear. Geolocation and bot rules can also produce a different chain. Redirect depth, request time, and response size are limited, and private network destinations are blocked. The public URL is submitted to buffer.lol for the check.",
    faq: [
      { question: "How many redirects should a URL use?", answer: "Directly reaching the final canonical URL is best. One intentional redirect is common, but avoid chains when the first hop can point straight to the destination." },
      { question: "Can this detect JavaScript redirects?", answer: "Not reliably. It follows HTTP redirects from response status and Location headers rather than executing a full browser page." }
    ]
  }),
  "robots-sitemap": seo({
    title: "Robots.txt and Sitemap Checker",
    metaDescription: "Check a website's robots.txt, sitemap declarations, crawl rules, response status, and discoverable sitemap URLs.",
    intro: "The robots.txt and sitemap checker retrieves a public site's crawler instructions and looks for declared sitemap locations. It provides a fast technical check when a site is not being crawled as expected or after robots and sitemap changes.",
    how: "Enter a website URL or hostname and run the check. Review whether /robots.txt returns successfully, which user-agent groups and directives are published, and whether Sitemap lines point to reachable canonical files. Test the production hostname search engines actually crawl. Remember that robots rules use path-prefix matching and can differ by crawler, so inspect the most specific group that applies to the bot you care about.",
    read: "User-agent identifies the crawler group. Allow and Disallow directives describe paths that crawlers may or may not request, subject to each crawler's implementation. Sitemap declarations provide absolute sitemap URLs and can list more than one file. A missing robots.txt commonly means crawling is unrestricted, while a site-wide Disallow can prevent crawling. Robots rules control fetching; they are not a reliable way to remove an already known URL from search results.",
    limits: "This checker reports the published files and does not emulate every search engine's parser or indexing decision. A valid sitemap does not guarantee indexing, and a robots-allowed URL can still be excluded for quality, canonicalization, noindex, or response reasons. CDN variants, authentication, and bot-specific responses may differ from this server-side request. The submitted public site is processed by buffer.lol; internal targets are blocked.",
    faq: [
      { question: "Does Disallow remove a page from Google?", answer: "Not necessarily. It prevents compliant crawlers from fetching the path, but the URL can still be known or shown. Use an indexable noindex response when removal is the goal." },
      { question: "Do I need to list the sitemap in robots.txt?", answer: "It is a useful discovery mechanism but not the only one. Sitemaps can also be submitted directly through search-engine webmaster tools." }
    ]
  }),
  "dns-resolver-check": seo({
    title: "DNS Resolver Comparison Tool",
    metaDescription: "Compare A, AAAA, MX, NS, TXT, or CNAME answers from Cloudflare, Google, Quad9, and OpenDNS public resolvers.",
    intro: "The DNS resolver comparison tool queries four public recursive resolvers and normalizes their answers side by side. It is useful after DNS changes or when users on different networks report inconsistent results.",
    how: "Enter a public domain, choose a supported record type, and compare the results returned by Cloudflare, Google, Quad9, and OpenDNS. Start with the exact hostname and record type involved in the issue. Recheck after the previous TTL has elapsed, and compare the resolver answers with the authoritative record configured at your DNS provider. Differences can be temporary during a change or intentional when DNS responses vary by location or policy.",
    read: "Matching normalized answers indicate that the selected resolvers currently agree, not that every resolver worldwide has the same cache. A missing or different answer can reflect a stale cache, negative caching, DNSSEC validation behavior, filtering, geography, or resolver-specific policy. MX preference values, CNAME targets, and the complete TXT strings matter when comparing data. Use timestamps and TTL context when documenting propagation rather than relying on the word propagated alone.",
    limits: "The comparison covers four named public resolvers from the buffer.lol server's network location. It does not query ISP, enterprise, device, or authoritative resolvers and cannot represent every geographic edge. DNS answers may change immediately after the check. The submitted domain and record type are processed by the same-origin diagnostics API and sent to the selected public resolver endpoints only for this request.",
    faq: [
      { question: "Why do public DNS resolvers return different answers?", answer: "They may hold caches created at different times, apply different validation or filtering policies, or reach geographically varied authoritative infrastructure." },
      { question: "Does agreement mean DNS propagation is complete?", answer: "It means these four resolvers agree at the time of the test. Other recursive resolvers may still have different cached data." }
    ]
  }),
  "email-dns-health": seo({
    title: "Email DNS Health Checker",
    metaDescription: "Check MX, SPF, DMARC, DKIM, MTA-STS, and TLS reporting DNS records for a domain and review actionable mail configuration findings.",
    intro: "The email DNS health checker collects the public records commonly used to route and authenticate domain email. It reviews MX, SPF, DMARC, optional DKIM, MTA-STS, and TLS reporting signals in one diagnostic.",
    how: "Enter the domain used after the @ in an email address. If you want to check DKIM, provide the selector configured by your mail provider; selectors cannot be discovered reliably from DNS alone. Run the check after publishing mail records and compare each returned value with the provider's documented requirement. Correct syntax is only one part of delivery health, so send controlled test messages and review your provider's authentication results as a separate step.",
    read: "MX records identify inbound mail servers. SPF lists authorized sending sources, while DMARC states how receivers should handle messages that fail aligned SPF or DKIM checks and can publish reporting destinations. DKIM exposes the public key for a named selector. MTA-STS advertises a policy for protected SMTP delivery, and TLS-RPT publishes a reporting address. Findings should distinguish absent optional controls from malformed or conflicting records that can disrupt mail.",
    limits: "This tool checks published DNS data; it does not send email, test SMTP delivery, validate a private DKIM key, or guarantee inbox placement. Forwarding, alignment, reputation, provider behavior, and message construction remain important. DNS caches can delay changes, and a selector must be supplied for DKIM. The domain and optional selector are submitted to buffer.lol's diagnostics API for the requested lookups.",
    faq: [
      { question: "Can the checker find my DKIM selector automatically?", answer: "No reliable DNS enumeration exists for selectors. Enter the selector supplied by your mail service, such as selector1 or google." },
      { question: "Does passing these checks guarantee email delivery?", answer: "No. Authentication records help, but reputation, content, alignment, receiver policy, and provider configuration also affect delivery." }
    ]
  }),
  "security-headers": seo({
    title: "HTTP Security Headers Checker",
    metaDescription: "Check HSTS, CSP, frame protection, MIME sniffing, referrer, permissions, and cross-origin HTTP security headers for a public URL.",
    intro: "The HTTP security headers checker reviews browser-facing response headers and highlights protections that are present, missing, or potentially weak. It provides an actionable starting point for hardening a public web response.",
    how: "Enter the exact HTTPS URL to inspect. Check representative HTML pages rather than assuming one route's policy applies everywhere, and include error or authentication pages when they use different infrastructure. Read each finding in the context of the application before copying a recommended value. Content Security Policy and cross-origin isolation headers in particular require testing because an overly strict deployment can block legitimate scripts, frames, downloads, or integrations.",
    read: "HSTS tells browsers to prefer HTTPS for future requests. Content-Security-Policy restricts resource sources and other browser capabilities. X-Content-Type-Options reduces MIME sniffing, while frame-ancestors or X-Frame-Options controls embedding. Referrer-Policy limits referrer information, Permissions-Policy controls selected browser features, and COOP, COEP, or CORP influence cross-origin isolation. A present header can still be ineffective if its directive or scope is unsuitable.",
    limits: "Header review is not a vulnerability scan and cannot assess application code, dependencies, authentication, cookies, server patching, or whether a policy breaks real user flows. The server-side request can receive a different response from authenticated browsers or other regions. Recommendations are general and require application-specific validation. Public URLs are submitted to buffer.lol; resolved private and reserved targets are blocked.",
    faq: [
      { question: "Will adding every recommended header make a site secure?", answer: "No. Headers are one layer of browser hardening. Secure code, authentication, dependency management, infrastructure, and testing are still required." },
      { question: "Why must Content Security Policy be tested first?", answer: "A policy can block required scripts, styles, connections, frames, or workers. Report-only deployment and browser testing help identify needed sources safely." }
    ]
  }),
  "my-ip": seo({
    title: "What's My Public IP Address?",
    metaDescription: "Find the public IPv4 or IPv6 address your connection exposes to buffer.lol with a simple on-demand browser check.",
    intro: "The What's My IP tool shows the public IP address observed when your browser connects to buffer.lol. It is a quick way to confirm the internet-facing address associated with the current connection, VPN, or proxy path.",
    how: "Select Detect my IP while connected through the network you want to inspect. Run it before and after enabling a VPN, switching from Wi-Fi to cellular, or changing an internet connection to confirm whether the visible address changes. Copy the result only when you are comfortable sharing it. The value can be IPv4 or IPv6 depending on the route and protocol used for the request.",
    read: "A public IP identifies an internet connection endpoint or provider-assigned interface, not necessarily one device or person. Home and mobile providers often use dynamic addressing, and carrier-grade NAT can place many customers behind a shared IPv4 address. A VPN or forward proxy normally exposes its exit address instead of the access provider's address. IPv6 connections may use temporary addresses that rotate for privacy.",
    limits: "The result is the address buffer.lol can infer from the request and trusted hosting headers. Other destinations may see a different address when a proxy uses multiple exits or when IPv4 and IPv6 routes differ. The tool does not reveal a precise physical location or prove identity. The address is processed to return it to this page; ordinary hosting and abuse-prevention logs may still contain request metadata as described in the privacy notice.",
    faq: [
      { question: "Why did my public IP address change?", answer: "Providers can assign dynamic addresses, VPN exits can rotate, and IPv6 privacy addresses can change. Switching networks also changes the visible connection." },
      { question: "Can someone find my exact location from this IP?", answer: "No. IP geolocation is approximate and often represents a provider or network area rather than a device's physical position." }
    ]
  }),
  "ip-geolocation": seo({
    title: "IP Address Geolocation and Network Lookup",
    metaDescription: "Look up a public IP address's approximate country, network allocation, autonomous system number, and registered provider.",
    intro: "The IP network lookup combines approximate geolocation with registered network and autonomous-system information for a public address. It can help identify the provider and routing organization behind an address without implying a precise device location.",
    how: "Enter a public IPv4 or IPv6 address and run the lookup. Use the address exactly as observed, without a port or URL path. Compare the returned country and network data with an authoritative registration lookup when accuracy matters. If you are investigating your own connection, first use What's My IP to obtain the public address rather than entering a private address from a local network interface.",
    read: "Country and regional fields are estimates derived from network datasets and may reflect an ISP gateway, corporate network, VPN exit, or registration location. The ASN identifies the autonomous system announcing the route, while the network or provider name describes the registered or inferred organization. These values can be operationally useful for routing and abuse triage, but they do not identify the person using an address.",
    limits: "IP geolocation is inherently approximate and can be stale, especially for mobile networks, VPNs, satellite providers, newly transferred ranges, and anycast services. It must not be used for emergency response, legal conclusions, surveillance, or precise access decisions. Private, reserved, loopback, and documentation addresses are rejected. The submitted public address is processed by buffer.lol and the configured network-data source for this on-demand result.",
    faq: [
      { question: "How accurate is IP geolocation?", answer: "Country-level data is often more reliable than city or region data, but no IP result should be treated as a precise physical location." },
      { question: "Does the ASN identify the person using the IP?", answer: "No. It identifies the network announcing the route, such as an ISP, cloud platform, business, or other operator." }
    ]
  }),
  "asn-lookup": seo({
    title: "ASN and ISP Lookup",
    metaDescription: "Find the autonomous system number, ISP or network organization, announced prefix, and registration details behind an IP or ASN.",
    intro: "The ASN and ISP lookup identifies the autonomous system and registered network information associated with a public IP address or ASN. It is useful for understanding which organization originates a route and which network block contains an address.",
    how: "Enter a public IPv4 or IPv6 address, or an autonomous system number such as AS13335. For an IP query, review the matched prefix and origin ASN. For an ASN query, inspect the registered name and related routing or registry fields returned by the data source. Compare results with a live BGP route collector when you need time-sensitive routing visibility, because registration and routing answer different questions.",
    read: "An autonomous system number identifies a network participating in interdomain routing. The origin ASN is the system announcing a prefix in BGP, while a registered organization or ISP name describes administrative data associated with the resource. A prefix is the address block covered by the route. Hosting providers, transit networks, CDNs, and customer organizations can appear in different roles, so the displayed name is not always the consumer-facing ISP.",
    limits: "ASN and registration datasets can lag route changes, transfers, mergers, and multi-origin announcements. An address can be announced by a partner or mitigation provider without changing the underlying registrant. The result does not identify an individual subscriber or prove ownership of traffic. Private and reserved addresses are rejected, and the submitted IP or ASN is processed through the buffer.lol API for the lookup.",
    faq: [
      { question: "What is the difference between an ASN and an IP address?", answer: "An IP identifies an interface or routed endpoint. An ASN identifies a network that exchanges routing information for one or more IP prefixes." },
      { question: "Is the ASN always the same as the ISP?", answer: "Not always. The announcing network may be a cloud, transit, CDN, security, or enterprise provider rather than the subscriber's retail ISP." }
    ]
  }),
  "user-agent": seo({
    title: "Browser User Agent Parser",
    metaDescription: "Parse this browser's user-agent string and inspect browser, rendering engine, operating system, device, language, and platform signals.",
    intro: "The user agent parser inspects the browser and platform signals available to this page. It provides a readable snapshot for debugging compatibility, support reports, and content-negotiation behavior.",
    how: "Open the page in the browser you want to inspect; no text entry is required. Review the raw user-agent string alongside parsed browser and platform fields, language preferences, viewport information, and available capability signals. When diagnosing a user report, record the complete relevant output and the feature that failed rather than relying only on a browser name or version label.",
    read: "The user-agent string is a compatibility identifier and often contains legacy tokens that do not describe the browser literally. Platform and vendor values are browser-provided hints. Language fields reflect browser preferences, while viewport and display values depend on the current window and device scale. Modern browsers reduce or freeze parts of the user agent to limit fingerprinting, so precise operating-system or device identification may be unavailable by design.",
    limits: "User-agent parsing is heuristic and should not be used as proof of identity, security posture, or exact hardware. Strings can be changed by users, extensions, automation, privacy features, and proxies. Feature detection is usually safer than browser sniffing when deciding whether code can use a web API. The parsing and display happen locally in the browser; the tool does not submit these displayed values as a separate diagnostic request.",
    faq: [
      { question: "Why does my user agent contain names of other browsers?", answer: "Historical compatibility tokens let browsers receive sites built for older engines. They should not all be interpreted as installed browsers." },
      { question: "Can a user-agent string identify a device exactly?", answer: "Usually not, and modern privacy protections intentionally reduce that precision. Treat parsed device details as hints." }
    ]
  }),
  "json-formatter": seo({
    title: "JSON Formatter and Validator",
    metaDescription: "Format, validate, pretty-print, or minify JSON locally in your browser without sending the input to a server.",
    intro: "The JSON formatter validates JSON text and converts it into readable indented output or compact minified output. Processing stays in this browser tab, making it suitable for data that should not be submitted to an online backend.",
    how: "Paste or type a JSON document in the input area. Select Format JSON to parse the value and print it with consistent indentation, or Minify to remove unnecessary whitespace. A parsing error means the input is not valid JSON; use the reported position and nearby syntax to find missing quotes, commas, braces, or brackets. Clear removes the current input and output from the interface.",
    read: "Successful formatting preserves JSON data types and structure while changing whitespace. Objects contain string keys and values; arrays preserve order; strings require double quotes; and the only literal values are true, false, and null. JSON does not allow comments, trailing commas, unquoted keys, NaN, Infinity, or undefined. Minified output is semantically equivalent but smaller, which can be useful for transport or compact storage.",
    limits: "The formatter uses the browser's native JSON parser and does not apply a schema, sort object keys, repair invalid input, or guarantee that another application accepts the resulting structure. JavaScript number parsing can lose precision for integers beyond the safe-number range. Very large documents may consume significant memory or make the tab slow. Input and formatted output are processed locally and are not sent to buffer.lol.",
    faq: [
      { question: "Does formatting JSON change its data?", answer: "It changes whitespace only. Parsing and re-serializing preserves standard JSON values, although extremely large numbers are subject to JavaScript number precision." },
      { question: "Why is valid JavaScript object syntax rejected?", answer: "JSON is stricter than JavaScript: keys and strings require double quotes, and comments, trailing commas, undefined, and other JavaScript values are not allowed." }
    ]
  }),
  base64: seo({
    title: "Base64 Encoder and Decoder",
    metaDescription: "Encode UTF-8 text to Base64 or decode Base64 back to readable text securely and locally in your browser.",
    intro: "The Base64 encoder and decoder converts UTF-8 text into Base64 or decodes Base64 into UTF-8 text. The conversion runs entirely in your browser and is useful for inspecting text-oriented payloads and configuration values.",
    how: "Enter ordinary text and select Encode to create a Base64 string. To reverse the operation, paste valid Base64 and select Decode. The encoder converts text to UTF-8 bytes before encoding, so accented characters and emoji are handled consistently. When decoding data from a URL, first determine whether it uses the URL-safe Base64 alphabet, which replaces + and / and may omit padding.",
    read: "Base64 represents binary data using printable ASCII characters and commonly ends with one or two equals signs as padding. Encoding increases size by roughly one third and does not conceal the content. A decoding error usually indicates invalid characters, incorrect padding, a URL-safe variant, or data that is not Base64. Successful byte decoding can still look incorrect when the original data was a file or used a character encoding other than UTF-8.",
    limits: "Base64 is an encoding, not encryption, hashing, compression, or access control. Anyone who receives the string can normally decode it. This interface is intended for text and displays decoded bytes as UTF-8; it is not a general binary file converter. Large inputs can consume browser memory. Both the source and result remain in the current tab and are not submitted to buffer.lol.",
    faq: [
      { question: "Is Base64 secure or encrypted?", answer: "No. It is a reversible representation designed for transport through text systems. Do not use it to protect secrets." },
      { question: "Why will a Base64 URL value not decode?", answer: "Base64url uses - and _ instead of + and / and can omit = padding. It may need normalization before a standard Base64 decoder accepts it." }
    ]
  }),
  "hash-generator": seo({
    title: "SHA Hash Generator",
    metaDescription: "Generate SHA-256, SHA-384, or SHA-512 hexadecimal hashes from text locally with the browser Web Crypto API.",
    intro: "The SHA hash generator calculates SHA-256, SHA-384, or SHA-512 digests for text using the browser Web Crypto API. It produces a deterministic hexadecimal fingerprint without sending the source text to a server.",
    how: "Enter the exact text to hash, choose an algorithm, and generate the digest. Whitespace, capitalization, line endings, and character encoding all affect the result, so preserve the original input exactly when comparing hashes from two systems. This tool encodes text as UTF-8 before hashing. To verify a published checksum for a downloaded file, use a file-aware hashing program instead of pasting displayed file contents.",
    read: "The same bytes and algorithm always produce the same digest. SHA-256 output contains 64 hexadecimal characters, SHA-384 contains 96, and SHA-512 contains 128. A one-character input change should produce a very different result. Matching hashes provide strong evidence that inputs are identical, but a bare digest does not identify who created the input or when it was produced.",
    limits: "Cryptographic hashes are one-way fingerprints, not encryption, but fast general-purpose SHA algorithms are not suitable by themselves for password storage. Password systems need a salted, deliberately expensive password-hashing function such as Argon2, scrypt, or bcrypt. This tool hashes UTF-8 text rather than uploaded files and does not create HMAC signatures. Input and digest generation remain local to the browser.",
    faq: [
      { question: "Can a SHA hash be decrypted?", answer: "No direct decryption operation exists because hashing is one-way. Weak or predictable inputs can still be guessed by hashing candidates and comparing results." },
      { question: "Should I store passwords with SHA-256?", answer: "Not by itself. Use a password-specific algorithm with a unique salt and an appropriate work factor." }
    ]
  }),
  "uuid-generator": seo({
    title: "UUID v4 Generator",
    metaDescription: "Generate 1, 4, 10, or 25 random RFC 4122 UUID version 4 identifiers securely and locally in your browser.",
    intro: "The UUID generator creates random version 4 universally unique identifiers with the browser's cryptographic random source. Generate one identifier or a small batch and copy the results without a server request.",
    how: "Choose the number of UUIDs and select Generate UUIDs. Each result uses the familiar 8-4-4-4-12 hexadecimal layout. Copy the complete list when seeding development data, assigning client-generated object IDs, or creating correlation values. Generate fresh identifiers rather than editing characters in an existing UUID, because the version and variant bits have defined positions.",
    read: "A version 4 UUID contains 122 random bits plus fixed version and variant bits. The third group begins with 4, and the first character of the fourth group reflects the standard variant. UUIDs are designed to make accidental collisions extraordinarily unlikely without a central sequence service. They are identifiers, not compact numbers, timestamps, or evidence that an object is authentic.",
    limits: "UUID uniqueness is probabilistic rather than a mathematical guarantee, though collisions are negligible for ordinary use with a secure random generator. UUIDs are often guess-resistant but should not be treated as passwords, authorization tokens, or proof of access. This tool creates v4 values only; it does not generate time-ordered UUID versions. Generation and copying occur locally in the browser.",
    faq: [
      { question: "Are UUID v4 values guaranteed to be unique?", answer: "No random identifier has an absolute guarantee, but the available random space makes collisions extraordinarily unlikely in normal systems." },
      { question: "Can I use a UUID as a secret token?", answer: "It is better to use a purpose-built token with an explicit security design, sufficient entropy, expiration, and server-side validation." }
    ]
  }),
  timestamp: seo({
    title: "Unix Timestamp Converter",
    metaDescription: "Convert Unix timestamps in seconds or milliseconds to readable dates, or convert date and time input back to Unix time locally.",
    intro: "The Unix timestamp converter translates numeric epoch values into readable date information and converts date input back to Unix time. It helps debug logs, APIs, databases, cache expirations, and signed-token time claims.",
    how: "Enter a Unix timestamp and convert it to inspect the represented instant. Confirm whether the source uses seconds, milliseconds, microseconds, or another unit; contemporary millisecond values contain three more digits than second values. For the reverse direction, enter a date with an explicit timezone or offset whenever possible. Compare the UTC result rather than a localized display when coordinating across systems.",
    read: "Unix time counts elapsed seconds from 1970-01-01 00:00:00 UTC, ignoring leap seconds in common implementations. One instant can be displayed differently in local time zones while retaining the same epoch value. Ten-digit values are commonly seconds for current dates, and thirteen-digit values are commonly milliseconds. Negative values represent instants before the epoch when supported by the parser and surrounding system.",
    limits: "Human-readable date parsing can be ambiguous when input omits a timezone or uses locale-specific ordering. Browser and runtime date ranges, daylight-saving rules, and historical timezone databases can also affect display. Always use an ISO 8601 value with a Z suffix or numeric offset for interoperable input. Conversions run locally and entered timestamps or dates are not sent to buffer.lol.",
    faq: [
      { question: "Is a Unix timestamp tied to a timezone?", answer: "The numeric timestamp represents an instant relative to UTC. Timezones affect only how that instant is displayed as a calendar date and clock time." },
      { question: "How can I tell seconds from milliseconds?", answer: "Current Unix seconds usually have 10 digits, while milliseconds have 13. Source documentation is the authoritative way to confirm the unit." }
    ]
  }),
  "url-parser": seo({
    title: "URL Parser, Encoder, and Decoder",
    metaDescription: "Parse URL components and query parameters, or encode and decode URL text safely in your browser without submitting it.",
    intro: "The URL parser separates a URL into protocol, hostname, port, path, query parameters, and fragment. It also encodes or decodes URL components locally for debugging links, callbacks, and API requests.",
    how: "Paste an absolute URL to inspect its structured components and query parameters. Use component encoding for a value that will occupy one part of a URL, such as a query parameter, rather than encoding an entire already-structured URL. Decode only when you need to inspect escaped text, and be careful with repeated decoding because a percent sign produced by the first pass can be interpreted again by a second pass.",
    read: "The scheme selects the protocol, the host combines hostname and optional port, and the path identifies a resource hierarchy. The query follows ? and can contain repeated keys, empty values, or ordering that an application treats as significant. The fragment follows # and is normally handled by the browser rather than sent in an HTTP request. Percent-encoding represents bytes using % followed by two hexadecimal digits.",
    limits: "Parsing shows syntax, not whether a destination exists, is safe, or will interpret parameters as expected. Internationalized hostnames, application-specific schemes, plus signs in form encoding, and nested URLs can require context-specific handling. Do not automatically navigate to untrusted parsed output. All parsing, encoding, and decoding happen in this tab, and entered URLs are not sent to buffer.lol by this tool.",
    faq: [
      { question: "Should I encode a whole URL with encodeURIComponent?", answer: "Usually not. Encode individual component values so structural characters such as :, /, ?, &, and = retain their URL roles." },
      { question: "Is the fragment sent to the web server?", answer: "Normally no. The browser uses the portion after # on the client and excludes it from the HTTP request target." }
    ]
  }),
  "jwt-decoder": seo({
    title: "JSON Web Token (JWT) Decoder",
    metaDescription: "Decode JSON Web Token headers and payloads locally in your browser without sending the token or claiming to verify its signature.",
    intro: "The JWT decoder displays the JSON header and payload contained in a JSON Web Token. Decoding runs locally and helps inspect claims during development, but it deliberately does not verify the token's signature or trustworthiness.",
    how: "Paste a compact JWT with its dot-separated header, payload, and signature segments. Decode it to view the JSON fields in the first two segments. Check registered time claims such as exp, nbf, and iat as Unix seconds, and inspect issuer, audience, and subject only in the context of the system that created the token. Use the relevant server or identity-provider library when you need actual validation.",
    read: "The header commonly names a signing algorithm and key identifier. The payload contains claims, which are statements made by the issuer. The signature segment protects integrity only when it is verified using an allowed algorithm and trusted key. Readable claims are not secrets: standard JWT segments use Base64url encoding, not encryption. An attacker can alter decoded text unless the receiving application rejects the resulting signature.",
    limits: "This tool does not verify signatures, key trust, issuer, audience, expiration, not-before time, nonce, token type, or revocation. Never treat a decoded token as valid based on its appearance. Avoid pasting production bearer tokens into tools you do not control; although this decoder works locally, tokens can also remain in clipboard history or browser memory. The entered token is not sent to buffer.lol.",
    faq: [
      { question: "Does decoding a JWT verify it?", answer: "No. Verification requires a trusted key, an explicitly allowed algorithm, and validation of claims such as issuer, audience, and time bounds." },
      { question: "Are JWT payloads encrypted?", answer: "Ordinary signed JWTs are only encoded and can be read by anyone holding the token. Encrypted JWT formats require separate JWE handling." }
    ]
  }),
  "regex-tester": seo({
    title: "JavaScript Regex Tester",
    metaDescription: "Test JavaScript regular expressions locally and inspect matches, capture groups, indexes, named groups, and common flags.",
    intro: "The JavaScript regex tester runs a pattern against sample text and displays matches, capture groups, and indexes. It uses the browser's regular-expression engine, so results correspond to JavaScript syntax and supported flags.",
    how: "Enter a pattern without surrounding slash delimiters, choose flags, add sample text, and run the test. Use g to collect multiple matches, i for case-insensitive matching, m to change line-anchor behavior, s to let dot match line terminators, u for Unicode-aware parsing, and y for sticky matching from the current position. Reduce a failing expression to the smallest representative input before adding optional branches or nested quantifiers.",
    read: "Each match includes the complete matched substring and its start index. Parentheses create numbered capture groups unless they are non-capturing, and named groups expose a keyed result. With the global flag, the engine continues after each match. Anchors, character classes, greediness, lookarounds, and Unicode behavior depend on the chosen flags and JavaScript semantics, which can differ from PCRE, .NET, Python, RE2, or command-line tools.",
    limits: "The tester does not prove that a pattern is safe for untrusted or very large input. Backtracking expressions can consume excessive CPU and create denial-of-service risk even when they work on short samples. Regex is also a poor fit for parsing many nested grammars. Testing and sample text remain in the browser, and the tool does not submit them to buffer.lol.",
    faq: [
      { question: "Why does this regex behave differently from another tester?", answer: "Regex dialects differ. This tool uses JavaScript's RegExp syntax, features, Unicode rules, and flag behavior." },
      { question: "What does the global flag change?", answer: "The g flag asks JavaScript to find successive matches instead of stopping after the first one." }
    ]
  })
};
