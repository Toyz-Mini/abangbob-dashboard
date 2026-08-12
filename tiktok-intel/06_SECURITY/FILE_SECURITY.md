# File Security

Allowed launch types: CSV and XLSX only.

Controls:
- extension allowlist
- content validation
- size/row limits
- generated filenames
- isolated storage
- no macro execution
- no external link fetching
- no formula evaluation
- zip-bomb/resource limits
- malware scanning strategy
- safe parsing
- audit events

CSV/XLSX content is untrusted input.
