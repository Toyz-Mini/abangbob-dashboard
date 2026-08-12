# Storage Backup & Restore

Database backup and object storage backup are separate controls.

A valid restore test must restore both Postgres and raw/generated files, verify file hashes, verify import-to-file references, run an analysis smoke test, verify tenant isolation and record RPO/RTO evidence.
