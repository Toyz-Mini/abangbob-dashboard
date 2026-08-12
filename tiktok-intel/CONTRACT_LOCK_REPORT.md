# Contract Lock Report

Produced during Phase 0 of `BUILD_WORKFLOW.md`.

`CLAUDE.md` requires that when documents conflict the build **stops and reports
the conflict rather than silently guessing**. This file is that report. It
records every conflict, gap, declared decision and schema delta encountered
while implementing the pack, so that each one is a visible, reviewable item
rather than an assumption buried in code.

Nothing here has been resolved by inventing a TikTok metric definition, a source
column, or a rule threshold.

**Status: 4 items block release.** They are marked **BLOCKER** below.

---

## Conflicts

### CONFLICT-001 — P0 rule scope disagrees with the P0 rule catalog · **BLOCKER**

| Document | Rules |
|---|---|
| `03_INTELLIGENCE/P0_RULE_COVERAGE_V1.6.json` | 24 rules declared in MVP P0 scope |
| `03_INTELLIGENCE/P0_RULE_CATALOG_V1.json` | 14 rules with an actual trigger |

Ten rules are declared in scope but carry no trigger, severity, evidence payload
or minimum sample anywhere in the pack:

`GMVMAX-002`, `GMVMAX-003`, `PROD-003`, `LIVE-001`, `LIVE-002`, `AFF-001`,
`AFF-002`, `CONTENT-001`, `CONTENT-002`, `ANOM-002`.

Four of them could not be implemented even if a trigger existed, because the
contracted schema has no grain to evaluate them at:

- `LIVE-001`, `LIVE-002` — `normalized_daily_metrics` carries only an aggregate
  `live_gmv`; there is no LIVE session grain.
- `AFF-001`, `AFF-002` — only an aggregate `affiliate_gmv`; there is no
  creator/affiliate grain.
- `CONTENT-001`, `CONTENT-002` — no content-grain table exists at all.

**Handling.** All ten are registered in `lib/contracts/rule-catalog.ts` with
status `SPEC_INCOMPLETE` and a stated `spec_gap`. Every analysis returns them in
`unevaluated_rules`, and the Insights screen lists them. They are never silently
dropped and never given invented thresholds.

**To resolve.** Either specify the ten triggers (plus the schema to support
LIVE, affiliate and content grains), or remove them from the P0 coverage map.

---

### CONFLICT-002 — GMV Max ROI has no denominator in the schema

`contracts/gmvmax_roi.contract.md` defines GMV Max ROI as *Product GMV Max Gross
Revenue divided by Product GMV Max Cost*, and
`contracts/gmvmax_cost_per_order.contract.md` divides that cost by attributed SKU
orders. `supabase/migrations/0001_initial_schema.sql` carries `gross_revenue`
but **neither denominator**.

Rule `GMVMAX-001` therefore could not be evaluated at all without substituting
the generic `spend` column — precisely the substitution
`02_DATA/METRIC_SEMANTIC_GUARDRAILS.md` prohibits.

**Handling.** `gmvmax_cost` and `gmvmax_orders` added additively in
`0003_implementation_deltas.sql` (DELTA-001). When either is absent the
`ATTRIBUTION-INCOMPATIBLE` confounder fires and `GMVMAX-001` is suppressed
rather than approximated.

---

### CONFLICT-003 — `imports` cannot represent an import awaiting mapping

`import_files.status` includes `MAPPING_REQUIRED`, but `imports.status` does not
(`CREATED, VALIDATING, READY, FAILED, CANCELLED`). The mapping lifecycle in
`02_DATA/DATA_MAPPING_SPEC.md` (AUTO_MAPPED → USER_CONFIRMED → VALIDATED) has no
representable state on the import itself, and `POST /imports/{id}/confirm` in the
OpenAPI contract has nothing to act on.

**Handling.** `MAPPING_REQUIRED` added to the `imports` status check, plus
`mapping_state`, `mapping_json` and `provenance_json` columns (DELTA-004).

---

### CONFLICT-004 — RLS makes onboarding impossible

`0002_rls.sql` grants `select` and `update` on `workspaces` but **no `insert`
policy**. A newly signed-up user therefore cannot create their first workspace,
which is step 1 of Screen 01 in `11_DESIGN/SCREEN_SPEC.md`.

**Handling.** A `security definer` function `public.create_workspace()` creates
the workspace and its `OWNER` membership atomically under the caller's identity,
and writes an audit record (DELTA-004 area, in `0003`). Direct inserts remain
denied.

---

### CONFLICT-005 — API source of truth is stated as v1.5, but v1.6 ships

`CLAUDE.md` and `00_MASTER_INDEX.md` name `openapi/openapi.v1.5.json` as the
machine-readable API source of truth, while the V1.6 hardening layer describes
`openapi.v1.6.json` as "complete". Both files exist.

**Handling.** Implemented against **v1.6**, being the later and more complete
contract. `CLAUDE.md` should be updated to match.

---

### CONFLICT-006 — Migration numbering collides

`supabase/migrations/` shipped `0001_initial_contract.sql` and
`0002_rls_contract.sql` (comment-only prose) alongside `0001_initial_schema.sql`
and `0002_rls.sql` (executable). Two files share each version number, and a
migration runner would apply the prose files as no-ops.

**Handling.** The three non-executable files moved to `supabase/contracts/`. The
migrations directory now holds only runnable SQL, as `CLAUDE.md` requires.

---

## Gaps

### GAP-001 — No TikTok export format is certified · **BLOCKER**

`02_DATA/SUPPORTED_SOURCE_MANIFEST.md` requires that every export variant be
registered with a source ID, sample fixture, schema version, required columns,
optional columns, mapping template, validation rules and a golden import test —
and lists **zero** concrete variants. `02_DATA/TIKTOK_EXPORT_SPEC.md` and
`02_DATA/DATA_DICTIONARY.md` are meta-specifications: they state what a source
definition must contain, not what any TikTok export actually contains.

`CLAUDE.md` forbids inventing source columns, so no TikTok source could be
registered.

**Handling.** `lib/ingestion/source-registry.ts` ships three **synthetic**
sources (one derived from the pack's own
`fixtures/synthetic/gmv_max/manifest.json`). Any other `source_id` is rejected
with `UnsupportedSourceError`. A test asserts `hasVerifiedTikTokSource() ===
false`, so it fails the day a real export is registered without its fixture. The
Data Imports screen states this openly.

**To resolve.** Supply one authorized real export per variant, then register it
with a golden import test.

---

### GAP-002 — Golden vectors are three, for 24 declared rules · **BLOCKER**

`07_QA/P0_GOLDEN_VECTOR_REQUIREMENTS.md` requires six vector categories per P0
rule. `03_INTELLIGENCE/DIAGNOSTIC_GOLDEN_EXPECTATIONS.json` contains three
vectors in total.

**Handling.** `tests/golden/vectors.ts` implements **61 vectors** covering every
implemented rule across positive, negative, boundary, insufficient-sample,
suppression and missing-data cases. `tests/golden/golden.test.ts` additionally
enforces the requirement itself: a rule with a threshold but no boundary vector,
or confounders but no suppression vector, fails the suite.

All vectors are synthetic. Real-fixture golden tests remain outstanding, which
is why this stays a blocker.

---

### GAP-003 — Stockout confounder has no data to detect from

`P0_RULE_CATALOG_V1.json` suppresses `ATC-001`, `CONV-001` and `PROD-001` on
`STOCKOUT_CONFOUNDER`, but the contracted schema carries no stock, inventory or
availability field. Automatic detection is impossible.

**Handling.** The detector reads `business_events` rows of type `STOCKOUT` /
`OUT_OF_STOCK` / `INVENTORY_GAP` overlapping the period. When none exists the
finding is reported as *checked, not detected* **and** a limitation is attached
stating that stock levels are not in the uploaded data, so a stockout can only
be ruled out if it was recorded. Absence of evidence is never reported as
evidence of absence.

---

### GAP-004 — No resolution policy for re-imported dates

`normalized_daily_metrics` is unique on
`(shop_id, business_date, source_import_id)`, so importing the same date twice
leaves two rows. No document says which is authoritative.

**Handling (declared).** The row from the **most recently completed READY
import** wins. Superseded rows are retained, not deleted, so the audit trail
survives. Implemented in `resolveLatestPerDate()`.

---

### GAP-005 — AI explanation layer not implemented

`openapi.v1.6.json` exposes `POST /analyses/{id}/explanation` and
`05_AI/AI_OUTPUT_SCHEMA.md` fixes the payload. `DEC-001` (production AI
provider/model) is **OPEN** in `01_PRODUCT/OPEN_DECISIONS.md`.

**Handling.** The storage table exists (DELTA-006) and is deliberately separate
from `diagnoses`, so AI output can never share a row with deterministic fields it
is forbidden to alter. The endpoint is not implemented pending DEC-001. No
deterministic behaviour depends on it.

---

## Declared implementation decisions

Required by the contracts, but with no formula specified. Each is deterministic,
versioned with the diagnostic engine, and exposed in full in the UI so a user can
audit any number back to its inputs.

### DECISION-001 — Conversion rate denominator

`cvr = orders / product_views`.

`CONV-001` names `cvr_change_pct` without defining the denominator. `DATA-002`
pairs the conversion sample gate with `product_views` ("Orders < 10 OR
product_views < 100 for a conversion/product diagnosis"), which makes product
views the coherent reading. Sessions-based conversion is available separately as
traffic-to-order and is not used by any rule.

### DECISION-002 — Priority formula

`priority = 0.45·severity + 0.35·impact + 0.20·confidence`

Severity leads because it encodes the contract author's judgement; impact is
measured from the shop's own numbers; confidence damps signals the evidence
cannot yet support. Impact is the estimated GMV movement attributable to the
signal, normalised against baseline GMV. An unmeasurable impact scores neutral
(0.5) rather than zero, so a high-severity finding is not buried merely because
revenue attribution is unavailable.

### DECISION-003 — Health dimension scoring

`HEALTH_SCORE_SPEC.md` fixes the weights (Traffic 20, Conversion 30, Product 20,
Ads 20, Growth 10) and requires missing dimensions to be reweighted rather than
zeroed, but does not say how a metric change becomes a 0–1 score.

Declared: a symmetric band where −50% scores 0, no change scores 0.5, and +50%
scores 1. The Product dimension is the GMV-weighted mean of per-product
conversion change, so a long tail of tiny products cannot outvote the products
carrying the shop.

### DECISION-004 — Confidence components

The 30/30/25/15 weighting is contracted; the component measures are not.
Declared: data completeness is the share of expected days carrying each required
metric (worst of current and baseline); signal strength scores 0.5 exactly at
the threshold and 1.0 at twice it; cross-signal agreement is the share of
corroborating signals moving in the predicted direction; sample sufficiency
treats three times the rule's minimum as fully sufficient. An unmeasurable
component scores neutral (0.5), never zero.

### DECISION-005 — Threshold comparison tolerance

Rule triggers are inclusive ("<= −15%"), but the values reaching them are
computed by dividing and subtracting IEEE-754 doubles: a conversion rate that
declines by exactly 15% can compute as −0.14999999999999997. Comparisons use a
tolerance of 1e-9, so a shop sitting exactly on a documented threshold triggers
its rule. The tolerance is far below any meaningful business movement and does
not widen the contracted threshold.

### DECISION-006 — Analysis status precedence

`DATA_INVALID` outranks every other status: if the inputs contradict themselves,
no diagnosis drawn from them is trustworthy, so the analysis exposes no primary
diagnosis. Otherwise: no diagnoses → `HEALTHY`; only anomaly diagnoses →
`ANOMALY`; anything else → `PROBLEM_DETECTED`. A missing required funnel metric
terminates the analysis as `INSUFFICIENT_EVIDENCE` under `DATA-001`.

---

## Schema deltas

All additive; nothing in `0001_initial_schema.sql` is redefined or dropped.
Applied in `0003_implementation_deltas.sql`.

| ID | Delta | Driver |
|---|---|---|
| DELTA-001 | `gmvmax_cost`, `gmvmax_orders` on `normalized_daily_metrics` | CONFLICT-002 |
| DELTA-002 | `gen_random_uuid()` defaults on all primary keys | Contract notes UUID generation is deployment-adaptable |
| DELTA-003 | `jobs` table + concurrent-import helper | `BACKGROUND_JOBS.md`; OpenAPI returns `job_id` |
| DELTA-004 | Import mapping state, `import_validation_issues`, workspace bootstrap | CONFLICT-003, CONFLICT-004, Screen 09 |
| DELTA-005 | `idempotency_keys` | Locked decision: Idempotency-Key required on mutating POSTs |
| DELTA-006 | `analysis_explanations` | OpenAPI explanation endpoint; `AI_OUTPUT_SCHEMA.md` |
| DELTA-007 | Supersession and lookup indexes | GAP-004 |

RLS for every new tenant-owned table mirrors the membership model of
`0002_rls.sql`. `idempotency_keys` has RLS enabled with **no** select policy, so
end users cannot read it while the service role continues to work.

---

## Open decisions inherited unchanged

From `01_PRODUCT/OPEN_DECISIONS.md`, still open and not resolved here:

| ID | Decision | Blocks |
|---|---|---|
| DEC-001 | Production AI provider/model | AI explanation layer (GAP-005) |
| DEC-002 | Production monitoring provider | Production readiness |
| DEC-003 | Support/on-call owner | Production readiness |
| DEC-004 | Commercial plan/pricing | Launch |

---

## Verification status

| Area | Status |
|---|---|
| Typecheck (`tsc --noEmit`) | Passing, strict, `noUncheckedIndexedAccess` on |
| Unit + contract + golden tests | 179 passing |
| Production build | Passing |
| All screens render | Verified in light, dark and mobile |
| CSP | Verified: nonce-based, no violations at runtime |
| Migrations applied to a live database | **Not verified** — no Supabase project available in this environment |
| API routes exercised against a live database | **Not verified** — same reason |
| RLS cross-tenant tests (`RLS_TEST_CONTRACT.sql`) | **Not written** — requires a disposable database · **BLOCKER** |
| Real TikTok fixtures | **None** · **BLOCKER** (GAP-001) |

---

## Release blockers

1. **GAP-001** — no certified TikTok export format; the importer can accept only
   synthetic sources.
2. **GAP-002** — golden vectors run on synthetic fixtures only; real-fixture
   regression tests are a release prerequisite.
3. **CONFLICT-001** — ten rules are declared in MVP scope with no implementable
   specification.
4. **RLS cross-tenant tests** — `supabase/contracts/RLS_TEST_CONTRACT.sql`
   specifies five required assertions; none are automated yet, and they need a
   disposable database in CI.
