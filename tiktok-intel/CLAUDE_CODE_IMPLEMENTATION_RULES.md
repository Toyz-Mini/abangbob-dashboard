# Claude Code Implementation Rules

1. Treat `/docs/00_MASTER_INDEX.md` as documentation navigation.
2. Treat `/docs/01_PRODUCT/PRD.md` as product scope.
3. Do not invent TikTok metric definitions. Use the metric dictionary/platform knowledge.
4. Do not put diagnostic logic only in UI.
5. Do not let AI become the source of truth for metrics or diagnoses.
6. Every P0 requirement must map to implementation and tests.
7. Preserve immutable analysis snapshots.
8. Never bypass tenant authorization.
9. Never trust uploaded spreadsheet content.
10. Do not execute formulas/macros/external links.
11. Do not send unnecessary PII to AI.
12. Use typed/validated API contracts.
13. Make background jobs idempotent.
14. Add tests before declaring a P0 feature complete.
15. When a requirement is ambiguous, mark it as an explicit decision/open question rather than silently guessing.
16. Update relevant documentation when implementation changes a contract.
