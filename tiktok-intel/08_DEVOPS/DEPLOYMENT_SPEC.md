# Deployment Specification

Environments:
local, development, staging, production.

Flow:
PR → CI → preview → staging → smoke → production.

Production deployment requires readiness gate pass.
