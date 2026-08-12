# Database Schema Contract

This is the executable database design authority.

For every table and column, implementation must specify:
- exact PostgreSQL type
- nullable
- default
- primary key
- foreign key
- unique constraint
- check constraint
- index
- RLS policy
- delete/update behaviour
- retention
- migration notes

## Mandatory tenant rule
Every tenant-owned row must have a deterministic authorization path to its workspace.

## Money
Use fixed-precision numeric types for monetary values. Do not use floating point for persisted financial amounts.

## IDs
Use UUIDs or another documented collision-resistant identifier.

## Dates
Store timestamps consistently and retain shop/report timezone semantics separately.
