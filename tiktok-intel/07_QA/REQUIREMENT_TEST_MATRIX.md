# Requirement → Test Matrix V1.4

| Requirement | Acceptance | Automated tests |
|---|---|---|
| REQ-PROD-001 | Workspace/shop ownership works | AUTH-001..004 |
| REQ-PROD-002 | CSV/XLSX upload works | IMP-001..010 |
| REQ-PROD-003 | Mapping preview/confirmation works | MAP-001..008 |
| REQ-PROD-004 | Invalid data is rejected with actionable errors | VAL-001..012 |
| REQ-PROD-005 | Metrics match canonical formulas | MET-001..020 |
| REQ-PROD-006 | Period comparison is correct | CMP-001..010 |
| REQ-PROD-007 | P0 rules match golden expectations | DIAG-001..050 |
| REQ-PROD-008 | Evidence is machine-readable | EVID-001..010 |
| REQ-PROD-009 | Insufficient evidence state works | DIAG-IE-001..010 |
| REQ-PROD-010 | Healthy state works | DIAG-H-001..010 |
| REQ-PROD-011 | Snapshots are immutable | SNAP-001..008 |
| REQ-PROD-012 | Cross-tenant access is impossible | SEC-TENANT-001..020 |
| REQ-PROD-013 | Recovery/rollback procedures work | DR-001..010 |
| REQ-PROD-014 | AI cannot override engine | AI-GOV-001..015 |

A P0 requirement is PASS only when all mapped mandatory tests pass.
