# Open Decisions — V1.6

This file contains ONLY decisions that are genuinely unresolved.

## Current unresolved decisions

| ID | Decision | Owner | Deadline | Status |
|---|---|---|---|---|
| DEC-001 | Final production AI provider/model | Product + Engineering | Before AI phase | OPEN |
| DEC-002 | Final production monitoring provider | Engineering | Before production | OPEN |
| DEC-003 | Final support/on-call owner | Business | Before production | OPEN |
| DEC-004 | Final commercial plan/pricing | Product | Before launch | OPEN |

## Already LOCKED — do not treat as open

- Manual CSV/XLSX ingestion for MVP
- Max upload size: 50 MB
- Max rows/file: 500,000
- Max concurrent imports/shop: 2
- Import timeout: 15 minutes
- API timeout: 30 seconds
- Analysis timeout: 10 minutes
- RPO target: <= 24 hours
- RTO target: <= 4 hours
- Raw file retention: 90 days
- Analysis snapshot retention: 24 months
- Audit retention: 24 months
- API version: `/api/v1`
- Pagination: cursor-based, default 50, max 200
- Mutating POST requests: Idempotency-Key required unless explicitly exempted by API contract
- AI is explanation-only and cannot override deterministic decisions

If a locked decision changes, create an ADR and update all affected contracts/tests.
