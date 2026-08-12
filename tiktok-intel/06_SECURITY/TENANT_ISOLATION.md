# Tenant Isolation

Every data access must be scoped to authorized workspace/shop ownership.

Automated tests must prove:
User A cannot read, modify, export or delete User B's shop/import/analysis/experiment data.

RLS is defense-in-depth, not a substitute for application authorization.
