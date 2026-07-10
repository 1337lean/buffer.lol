# buffer.lol Diagnostics Worker

This worker powers the traceroute tool for the main Next.js app.

It is intentionally separate from the website because route tracing needs Linux network tooling that browsers and typical serverless runtimes do not provide reliably.

## Endpoints

```http
GET /health
POST /api/traceroute
```

POST bodies use the same shape as the main app:

```json
{
  "input": "example.com"
}
```

Responses use the same envelope shape:

```json
{
  "data": {}
}
```

Errors return:

```json
{
  "error": "message"
}
```

## Environment

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `PORT` | No | `8080` | HTTP port inside the container. |
| `DIAGNOSTICS_WORKER_TOKEN` | Required in production |  | Requests must include `Authorization: Bearer <token>`. |
| `INCLUDE_RAW_DIAGNOSTICS` | No | `false` | Include raw traceroute command output. Disabled by default to avoid exposing internal hops. |
| `TRACEROUTE_MAX_HOPS` | No | `30` | Maximum traceroute hop count. |

## Docker Compose

Add the worker beside the main app and point the main app to the internal service URL:

```yaml
services:
  app:
    environment:
      ENABLE_WORKER_TOOLS: "true"
      DIAGNOSTICS_WORKER_URL: "http://diagnostics-worker:8080"
      DIAGNOSTICS_WORKER_TOKEN: "${DIAGNOSTICS_WORKER_TOKEN:?DIAGNOSTICS_WORKER_TOKEN is required}"
    depends_on:
      diagnostics-worker:
        condition: service_healthy

  diagnostics-worker:
    build:
      context: ../buffer.lol/diagnostics-worker
    cap_add:
      - NET_RAW
    environment:
      DIAGNOSTICS_WORKER_TOKEN: "${DIAGNOSTICS_WORKER_TOKEN:?DIAGNOSTICS_WORKER_TOKEN is required}"
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://127.0.0.1:8080/health"]
      interval: 30s
      timeout: 5s
      retries: 3
```

If your compose file lives somewhere else, adjust the `build.context` path to this `diagnostics-worker` directory.
