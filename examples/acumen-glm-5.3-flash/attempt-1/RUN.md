# Run: glm-5.3-flash — VOID:INFRA

Real run, 2026-10-22. Endpoint `https://ai.tcp.systems/v1`, model `glm-5.3-flash`,
attempt 1. The endpoint refused the request, so the run grades `VOID:INFRA` — the seat
failed, not the model, and no capability claim is made either way.

```bash
export LEMONADE_API_KEY=...                       # your key, never committed
node lemonade-probe.mjs \
  --model glm-5.3-flash \
  --base-url https://ai.tcp.systems/v1 \
  --root /tmp/probe-run \
  --slug acumen-glm-5.3-flash
```

```text
glm-5.3-flash att=1 VOID signals=000000000011 calls=0 ms=1252
notes=http_status=502 error=http 502: {"error":{"code":"all_candidates_failed",...

attempts=1 pass=0 fail=0 void=1
run dir: /tmp/probe-run/probe/runs/agentic-read-write-report-v1/acumen-glm-5.3-flash/attempt-1
```

Why this is kept:

- **`VOID` is not `FAIL`.** A `502` says nothing about whether the model can drive a
  harness, so the verdict refuses the comparison rather than recording a zero.
- **The row is still written.** `meta.json` carries `http_status: 502` and the error
  text, because a cluster of VOIDs is a finding about the endpoint, and a sheet that
  silently drops them hides an outage.
- **A VOID does not consume an attempt.** Fix the seat and re-probe; the row stays in the
  sheet with its status.
