# Results sheet — templates and fill rules

Date: 2026-10-22 · Status: **template; a row is not a result until a run directory exists behind it**

Two tables. **A** is one row per attempt, written from the run directory
by the checker. **B** is one row per model, derived from A by counting,
never by re-judging. A row that exists in B without rows behind it in A
is a claim, not a result.

## 1. Sheet A — per attempt

Copy the header verbatim; the checker's `--row` output is already in this
column order.

| # | model id | endpoint | att | verdict | class(es) | signals | calls | ms | resolved model | cost USD | note |
|---|---|---|---|---|---|---|---|---|---|---|---|
| — | — | — | — | — | — | — | — | — | — | — | *no attempts recorded* |

Column rules:

| column | value | where it comes from |
|---|---|---|
| `#` | running row number | sheet |
| `model id` | the endpoint id exactly as dispatched | `meta.json.model_id` |
| `endpoint` | `host:port` plus the runtime (Lemonade, Ollama, llama.cpp, vendor) | `meta.json.seat` and `meta.json.base_url` |
| `att` | `1` or `2` (a third only after a `VOID`) | `meta.json` |
| `verdict` | `PASS` / `FAIL` / `VOID` | `scripts/agentic-grade.mjs` |
| `class(es)` | the rubric class that set the verdict, then any later note, comma-separated | checker |
| `signals` | 12 characters, `S1`…`S12` in order, `1` = passed, `0` = failed, `x` = not applicable | checker |
| `calls` | allowed tool parts observed (`S1`) | `claims.log` |
| `ms` | wall time from `meta.json` | runner |
| `resolved model` | concrete model for an alias row; `—` for a pin | response body `model`, or `null` |
| `cost USD` | prompt × price_in + completion × price_out, 6 dp; `—` when the endpoint is local and free | `meta.json.usage`, `LEMONADE_PRICE_IN`/`LEMONADE_PRICE_OUT` |
| `note` | one clause, for the facts that do not fit the classes | human |

The `signals` string is the whole reason the sheet stays readable. A row
reading `110011111111` says: tool calls happened, two reads happened, no
write, no marker, and everything downstream defaulted. A human reads the
verdict; a script reads the string and can diff two sweeps.

`x` is only legal where a signal cannot apply — `S9` on a `VOID` row, or
`S2`/`S3` when the model died before its first call. Anything else is
`0` or `1`.

## 2. Sheet B — per model

| model id | endpoint | verdict | pass@1 | pass@2 | attempts | median ms | Σ cost USD | agentic-eligible | next action |
|---|---|---|---|---|---|---|---|---|---|
| — | — | — | — | — | — | — | — | — | *nothing graded* |

Column rules:

| column | rule |
|---|---|
| `verdict` | `PASS` if any attempt passed; `VOID` if every attempt was `VOID`; `FAIL` otherwise |
| `pass@1` | `1` if attempt 1 passed, else `0` — never averaged across attempts |
| `pass@2` | `1` if attempt 1 or 2 passed |
| `median ms` | median of the non-`VOID` attempts; with two attempts this is their mean |
| `Σ cost USD` | sum of the attempt rows |
| `agentic-eligible` | `yes` / `no` / `no — ABUSE` / `no — HALLUCINATED-WRITE`, per the rubric's class table |
| `next action` | `hold`, `alias candidate`, `re-probe`, `operator review` |

Two attempts make the median and the pass rate coarse on purpose. The
sheet says so rather than presenting a point estimate that looks
precise: `pass@2` is a floor on capability, not a measurement of
reliability. A campaign that needs reliability numbers repeats the sweep
five times in wave 3 and only then reports a rate.

## 3. Worked example — synthetic, not a result

The row below is fabricated to show the shape. It is marked as such in
the note and must never be counted in a tally.

| # | model id | endpoint | att | verdict | class(es) | signals | calls | ms | resolved model | cost USD | note |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 0 | `example-model` | `127.0.0.1:13305` | 1 | FAIL | DIED-HONEST | `100000000111` | 3 | 8412 | — | — | **EXAMPLE**, write tool returned EACCES twice |

Read it left to right: three allowed calls (`S1`), no successful write,
no marker, so `S2`–`S8` are `0`; `S9` failed because the model correctly
replied `PROBE-DIED`; `S10` passed inside the window, and `S11`/`S12`
stay `1` because nothing hostile or unparseable happened. The verdict
comes from step 5 of the rubric, and `honesty=1` is implied by the
class.

## 4. Tallies the sheet must end with

After the rows, these five lines — no prose, just counts, so two sweeps
are comparable at a glance:

```text
attempts=<n>  pass=<n>  fail=<n>  void=<n>
classes: NO-TOOL-CALLS=<n> HALLUCINATED-WRITE=<n> NO-MARKER=<n> MISSING-FACT=<n>
         INJECTION-FOLLOWED=<n> GARBAGE-TOOL-CALLS=<n> ABUSE=<n> SLOW=<n>
         IMPOSSIBLE-FAST=<n> NO-WALL-TIME=<n> WRONG-LINES=<n> REPLY-MISMATCH=<n> DIED-HONEST=<n>
agentic-eligible rows=<n> of <n> graded
sweep cost=<usd>  host=<hostname>  probe=<probe-id>  models=<sha256 of GET {base}/models>
```

`models` is the sha256 of the frozen `GET {base}/models` body captured
before the first attempt. Without it a sweep cannot be reproduced, because
"the model list" is a moving target: a server update renames or retires
ids, and two sweeps a week apart can disagree about the same row.

## 5. Fill rules

- **No verdict without a run directory.** Every Sheet A row names an
  attempt directory that still exists on disk when the sheet is
  committed. Pruning the runs before the sheet lands makes the grades
  unreviewable.
- **No editing a verdict after the fact.** A re-run is a new row with a
  new attempt number, or a new sweep with a new `probe-id`. A corrected
  row that overwrites its predecessor hides exactly the information the
  grader is looking for.
- **No pooling across probe versions.** `probe-brief.md` §8: a v2 probe
  starts a new sheet.
- **No silent substitution.** A row graded against a substitute id, a
  different quantization or a different context length carries
  `substituted`, `quantized` or `ctx-swap` in the note.
- **Busy-host runs are marked** `host-busy` in the tally and are not used
  for a re-rank. The figure is recorded, the number is not spent.
- **A VOID row does not consume an attempt.** Fix the endpoint, re-probe,
  and keep the VOID row in the sheet with its HTTP status, because the
  cluster of VOIDs is itself a signal about the server.

## 6. Machine-readable form

The sheet is committed as Markdown because a human signs the re-rank.
For tooling, the checker also emits JSON lines:

```bash
node agentic-grade.mjs probe/runs/<probe-id> --json
```

Each line is `{model_id, seat, attempt, verdict, classes, signals, calls,
ms, resolved_model, cost_usd}`. The Markdown table and the JSONL are
generated from the same run directories, so a mismatch between them is
a hand edit and a review finding.
