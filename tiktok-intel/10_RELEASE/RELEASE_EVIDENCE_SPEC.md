# Release Evidence Specification

Each production release must generate an evidence bundle containing:
- release version
- commit SHA
- build ID
- dependency lock state
- database migration version
- unit test report
- integration/contract report
- golden diagnostic report
- AI evaluation report where applicable
- security scan
- performance result
- UAT sign-off
- readiness matrix
- rollback reference

Evidence must be retained according to the release/audit retention policy.
