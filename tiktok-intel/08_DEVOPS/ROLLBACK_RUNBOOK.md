# Rollback Runbook

Application rollback:
identify bad deployment → select known-good immutable deployment → rollback → smoke test.

Database:
do not blindly rollback schema. Use forward-compatible migration or documented restore procedure.
