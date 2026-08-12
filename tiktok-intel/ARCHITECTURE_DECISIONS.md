# Architecture Decision Records

## ADR-001 — Manual upload first
Decision: MVP uses manual CSV/XLSX.
Reason: avoids API dependency and focuses on the decision-quality product loop.

## ADR-002 — Rule Engine before AI
Decision: deterministic rules are authoritative.
Reason: diagnoses must be reproducible, testable and evidence-grounded.

## ADR-003 — Immutable analysis snapshots
Decision: completed snapshots are immutable.
Reason: historical results must remain reproducible.

## ADR-004 — Background jobs for large imports
Decision: large processing is asynchronous.
Reason: prevents request timeouts and improves reliability.

## ADR-005 — TikTok API is future scope
Decision: do not block MVP on API integration.
Reason: manual data is sufficient to validate product value first.

New architectural decisions require an ADR before implementation when they materially affect system boundaries.
