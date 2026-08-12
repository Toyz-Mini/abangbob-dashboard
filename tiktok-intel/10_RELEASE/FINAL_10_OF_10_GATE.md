# FINAL 10/10 PRODUCTION GATE

## Documentation gate
PASS only if:
- all required docs exist
- all P0 requirements are traceable
- exact DB schema is approved
- exact API contract is approved
- P0 diagnostic thresholds are versioned
- supported source fixtures are verified
- all open production decisions are resolved
- security controls map to tests
- operational owners are assigned

## Engineering gate
PASS only if:
- build succeeds reproducibly
- all P0 automated tests pass
- all golden diagnostics pass
- API contract tests pass
- tenant isolation tests pass
- security tests pass
- load/performance tests pass
- UAT passes

## Operations gate
PASS only if:
- backup restore is proven
- rollback is proven
- monitoring works
- alerts work
- runbooks are tested
- RPO/RTO objectives are met

## Release evidence gate
PASS only if release evidence bundle contains:
commit, build, migrations, tests, security, performance, golden data, UAT, readiness matrix, rollback reference.

## Final certification

10/10 PRODUCTION READY is valid only when every mandatory gate is PASS.

No document length, number of files, or AI-generated confidence can substitute for missing evidence.


## Claude Code Gate
- [ ] CLAUDE.md reviewed
- [ ] OpenAPI JSON validates as OpenAPI 3.1
- [ ] DB changes represented by migrations
- [ ] RLS policies tested
- [ ] Metric contracts have fixture tests
- [ ] Authorized real TikTok fixtures installed for each supported importer
- [ ] MCP servers approved and least-privilege
- [ ] Build workflow followed


## V1.6 hard gates
- [ ] Supabase migrations contain executable schema SQL.
- [ ] RLS is enabled on all tenant-owned tables.
- [ ] RLS policies pass cross-tenant tests.
- [ ] OpenAPI upload, pagination and idempotency contracts validate.
- [ ] `/shops` follows the idempotency policy.
- [ ] P0 rule coverage file is complete.
- [ ] Every P0 rule has all required golden vectors.
- [ ] Real authorized fixtures exist for each supported importer before importer certification.
- [ ] Claude Code permissions policy is reviewed.
