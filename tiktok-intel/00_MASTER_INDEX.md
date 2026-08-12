# TikTok Shop Intelligence — Documentation Pack V1.3 A+

## Authority hierarchy
1. Security controls
2. Canonical metric/data contracts
3. Product scope
4. Deterministic intelligence contracts
5. Technical contracts
6. QA verification
7. Operations/compliance

## A+ rule
A document is not considered complete because it exists. It is complete only when its requirements are precise enough to implement, test and audit.

## Required chain
Requirement → Acceptance Criteria → Design Contract → Implementation → Test → Evidence → Release.

## Product architecture
Manual TikTok CSV/XLSX ingestion is MVP. TikTok API integration is future scope.
Rule Engine is authoritative. AI is explanatory only.


## Claude Code Build Layer
- `CLAUDE.md` — mandatory project operating contract
- `AGENTS.md` — implementation rules
- `openapi/openapi.v1.5.json` — machine-readable API contract
- `contracts/` — canonical metric/data contracts
- `fixtures/` — parser/normalization/golden fixture boundary
- `supabase/migrations/` — version-controlled DB changes
- `.mcp.json.example` + `MCP_POLICY.md` — controlled MCP usage
- `BUILD_WORKFLOW.md` — implementation sequence
- `03_INTELLIGENCE/TIKTOK_PLATFORM_KNOWLEDGE_V1.5.md` — verified platform facts


## V1.6 Hardening Layer
- `openapi/openapi.v1.6.json` — complete machine-readable API contract
- `supabase/migrations/0001_initial_schema.sql` — executable schema migration
- `supabase/migrations/0002_rls.sql` — executable RLS policies
- `supabase/migrations/0003_rls_tests.sql` — RLS test contract
- `03_INTELLIGENCE/P0_RULE_COVERAGE_V1.6.json` — complete MVP P0 coverage map
- `07_QA/P0_GOLDEN_VECTOR_REQUIREMENTS.md` — golden test requirements
- `02_DATA/METRIC_SEMANTIC_GUARDRAILS.md` — source/version/attribution guardrails
- `04_TECHNICAL/UPLOAD_STORAGE_STATE_MACHINE.md` — upload lifecycle
- `CLAUDE_CODE_PERMISSIONS.md` — high-risk agent permission policy
- `fixtures/REAL_FIXTURE_INTAKE.md` — authorized fixture certification gate


## V1.7 Design System Layer
- `11_DESIGN/DESIGN_STRATEGY.md`
- `11_DESIGN/DESIGN_SYSTEM.md`
- `11_DESIGN/DESIGN_TOKENS.md`
- `11_DESIGN/INFORMATION_ARCHITECTURE.md`
- `11_DESIGN/SCREEN_SPEC.md`
- `11_DESIGN/DASHBOARD_LAYOUT_SPEC.md`
- `11_DESIGN/COMPONENT_SPEC.md`
- `11_DESIGN/DIAGNOSTIC_UX_SPEC.md`
- `11_DESIGN/DATA_VISUALIZATION_SPEC.md`
- `11_DESIGN/ACCESSIBILITY_SPEC.md`
- `11_DESIGN/STATE_SPEC.md`
- `11_DESIGN/RESPONSIVE_UX_QA.md`
- `11_DESIGN/DESIGN_TO_CODE_CONTRACT.md`
- `11_DESIGN/DESIGN_BENCHMARK_MATRIX.md`
- `11_DESIGN/DESIGN_10_OF_10_AUDIT.md`
