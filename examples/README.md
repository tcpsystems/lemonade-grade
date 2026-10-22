# Example runs — real endpoints, nothing synthetic

Each directory is a complete attempt directory as the driver wrote it, copied here
unmodified. The only addition is `RUN.md`, which records the exact command.

| directory | endpoint | model | verdict | what it shows |
|---|---|---|---|---|
| [`deepseek-flash/attempt-1`](deepseek-flash/attempt-1) | `https://api.deepseek.com/v1` | `deepseek-flash` | **PASS** | a complete three-call loop: two reads, one write, the exact reply |
| [`acumen-glm-5.3-flash/attempt-1`](acumen-glm-5.3-flash/attempt-1) | `https://ai.tcp.systems/v1` | `glm-5.3-flash` | **VOID:INFRA** | the endpoint answered `502 all_candidates_failed`; no grade, re-probe |

The second run is here on purpose. A grading rig that only publishes its passes is a
marketing page; `VOID:INFRA` is the class that keeps an endpoint outage from being filed
as a model failure, and the row is kept with its HTTP status because a cluster of VOIDs
is itself a signal about the server.

## Reading a run

```text
attempt-1/
├── meta.json   clock, endpoint, http status, resolved model, token usage, cost
├── claims.log  one line per tool part the driver executed (not the model)
├── reply.txt   the final message, unmodified
├── marker.md   the artifact, copied after the run (absent when nothing was written)
└── stderr.log  driver notes; never graded
```

Grade them the way the rig does:

```bash
node agentic-grade.mjs examples/deepseek-flash
node agentic-grade.mjs examples/acumen-glm-5.3-flash --row
```

## Reproducing one

The command is in each `RUN.md`. Endpoints and model ids drift, so a reproduction a month
from now may legitimately produce a different class or a `VOID:INFRA`; what should not
change is that the marker is the only thing that proves a write, and the reply is checked
for exactly one line.

No credential is stored here. `LEMONADE_API_KEY` is read from the environment and never
written into a run directory.
