# TikTok Shop Intelligence

Turns manual TikTok Shop CSV/XLSX exports into normalized metrics,
evidence-backed diagnostics, priorities, recommendations and experiments.

This directory is a self-contained application with its own dependency tree. It
shares the repository with `abangbob-dashboard` but no code, database or build
with it.

**Read [`CONTRACT_LOCK_REPORT.md`](CONTRACT_LOCK_REPORT.md) first.** It lists
every conflict found in the documentation pack, every decision that had to be
declared because no contract specified it, and the four items that block
release.

---

## Running it

```bash
npm install
DEMO_MODE=1 npm run dev        # http://localhost:3100
```

With no Supabase project configured the app runs against a deterministic
**synthetic** dataset, labelled as such on every screen. It is not TikTok data
and must never be presented as such. To work against a real project, copy
`.env.example` to `.env.local` and fill it in.

```bash
npm run verify                 # typecheck + all tests
npm test                       # 179 unit, contract and golden-vector tests
npm run build
```

---

## Layout

```
lib/contracts/      Rule catalog, decision-contract types, contract versions
lib/metrics/        Canonical metric registry, period aggregation, change maths
lib/intelligence/   Baseline, confounders, rules, confidence, priority, health, engine
lib/ingestion/      Source allowlist, safe CSV/XLSX parsing, mapping, validation
lib/db/             Supabase clients and analysis persistence
lib/api/            Request envelope, auth, roles, idempotency, audit
app/api/v1/         Route handlers implementing openapi/openapi.v1.6.json
app/                Screens 02–12 from 11_DESIGN/SCREEN_SPEC.md
components/         Primitives and diagnosis presentation
supabase/migrations Executable schema and RLS
tests/              Golden vectors, metric contract tests, ingestion tests
```

Everything above `lib/` is the documentation pack itself, committed as the
version-controlled contract baseline.

---

## The properties worth knowing about

**The rule engine is the product; the UI only renders it.** All 14 implementable
P0 rules live in `lib/intelligence/rules.ts` with their triggers transcribed
verbatim from `03_INTELLIGENCE/P0_RULE_CATALOG_V1.json`. No rule logic exists in
a component.

**Rates are never averaged.** Every ratio is recomputed from summed numerators
and denominators over the period, so a quiet Tuesday cannot weigh the same as a
peak Saturday.

**Absent is not zero.** A metric missing from an export stays `null` all the way
through. Rules requiring it return `INSUFFICIENT_EVIDENCE` rather than
diagnosing against a fabricated zero.

**Attribution contexts never mix.** GMV Max ROI is computed only from GMV Max
cost, is never relabelled ROAS, and the metric registry throws if code tries to
compare it with paid ROAS.

**Confounders suppress rather than annotate.** A rule that would have fired but
sits behind a detected confounder is reported as suppressed, with its reason —
not quietly dropped and not presented as a finding.

**A confounder that cannot be checked says so.** Stock levels are absent from the
contracted schema, so a stockout is only ever *not recorded*, never *ruled out*.

**Every analysis is reproducible.** Snapshots persist the metric, rule-set and
engine versions, the resolved baseline, the contributing imports and a hash of
the exact rows consumed.

**Unimplementable rules stay visible.** The ten P0 rules with no specification
appear in every analysis result and on the Insights screen, rather than being
silently absent.

---

## Testing

The golden suite runs every vector through the real `runAnalysis` entry point —
the same code path the API uses — so a pass is evidence about the shipped
engine.

It also enforces its own coverage requirement: a rule with a threshold but no
boundary vector, confounders but no suppression vector, or a sample gate but no
insufficient-sample vector fails the suite. That check is what
`07_QA/P0_GOLDEN_VECTOR_REQUIREMENTS.md` asks for, expressed as a test rather
than a checklist.

All fixtures are synthetic. Real-fixture regression tests remain a release
prerequisite (GAP-002).
