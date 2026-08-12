# Production Readiness Checklist

## Product
- [ ] All P0 requirements implemented
- [ ] Acceptance criteria pass
- [ ] UX/UAT blockers closed

## Data
- [ ] Supported exports explicitly verified
- [ ] Metric definitions verified
- [ ] Attribution rules verified
- [ ] Reconciliation tested
- [ ] Data drift detection enabled

## Intelligence
- [ ] P0 diagnostic rules implemented
- [ ] Golden datasets pass
- [ ] Rule precedence/suppression tested
- [ ] Healthy state works
- [ ] Insufficient evidence works
- [ ] Invalid data works
- [ ] No causal overclaiming

## Technical
- [ ] DB constraints/indexes/RLS verified
- [ ] API contracts tested
- [ ] Idempotency tested
- [ ] concurrency tested
- [ ] cancellation tested
- [ ] migration tested

## Security
- [ ] Tenant isolation tests pass
- [ ] Auth tests pass
- [ ] File security tests pass
- [ ] XSS/formula injection tests pass
- [ ] dependency/secret scans pass
- [ ] AI security tests pass

## AI
- [ ] Output schema validated
- [ ] Prompt injection suite passes
- [ ] PII leakage suite passes
- [ ] cost limits enforced
- [ ] fallback tested

## QA
- [ ] Unit
- [ ] Integration
- [ ] Contract
- [ ] E2E
- [ ] Golden dataset
- [ ] Performance
- [ ] Security
- [ ] UAT

## Operations
- [ ] Monitoring
- [ ] Alerts
- [ ] Backup
- [ ] Restore test
- [ ] Rollback test
- [ ] Incident response
- [ ] Runbooks

## Compliance
- [ ] Privacy
- [ ] Terms
- [ ] Retention
- [ ] Deletion
- [ ] Third-party processor register

## Final gate
No unresolved P0 item.
No critical security finding.
No failed data/diagnostic golden test.
No untested production rollback path.

STATUS: NOT PRODUCTION READY until every mandatory gate is PASS.


## A+ Documentation Gate
- [ ] Requirement traceability complete
- [ ] Domain model complete
- [ ] Database schema contract complete
- [ ] API contract complete
- [ ] P0 diagnostic rule catalog complete
- [ ] Golden expectations complete
- [ ] Supported source manifest verified
- [ ] Metric change control tested
- [ ] Architecture decisions recorded
- [ ] Security control matrix mapped to tests
- [ ] Operational ownership assigned
- [ ] Release evidence bundle generated
- [ ] Open decisions resolved or explicitly deferred outside production scope
