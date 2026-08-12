# Database Migration

Migrations are version controlled.

Use expand → migrate → contract for breaking schema changes.

Never assume application rollback can safely reverse a database migration.
Test migrations in staging with representative data volume.
