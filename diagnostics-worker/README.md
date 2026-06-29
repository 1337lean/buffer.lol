# buffer.lol Diagnostics Worker

This worker powers the ping, packet-loss, and traceroute tools for the main Next.js app.

It is intentionally separate from the website because ICMP and route tracing need Linux network tooling and raw socket permissions that typical serverless runtimes do not provide reliably.

## Endpoints

```http
GET /health
POST /api/ping
POST /api/packet-loss
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
| `DIAGNOSTICS_WORKER_TOKEN` | Recommended |  | If set, requests must include `Authorization: Bearer <token>`. |
| `PING_COUNT` | No | `4` | Echo requests for `/api/ping`. |
| `PACKET_LOSS_COUNT` | No | `20` | Echo requests for `/api/packet-loss`. |
| `TRACEROUTE_MAX_HOPS` | No | `30` | Maximum traceroute hop count. |

## Docker Compose

Add the worker beside the main app and point the main app to the internal service URL:

```yaml
services:
  app:
    environment:
      ENABLE_WORKER_TOOLS: "true"
      DIAGNOSTICS_WORKER_URL: "http://diagnostics-worker:8080"
      DIAGNOSTICS_WORKER_TOKEN: "${DIAGNOSTICS_WORKER_TOKEN}"
    depends_on:
      diagnostics-worker:
        condition: service_healthy

  diagnostics-worker:
    build:
      context: ../buffer.lol/diagnostics-worker
    cap_add:
      - NET_RAW
    environment:
      DIAGNOSTICS_WORKER_TOKEN: "${DIAGNOSTICS_WORKER_TOKEN}"
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://127.0.0.1:8080/health"]
      interval: 30s
      timeout: 5s
      retries: 3
```

If your compose file lives somewhere else, adjust the `build.context` path to this `diagnostics-worker` directory.
