# API Contract V1.6

## Source of truth
`openapi/openapi.v1.6.json`.

## Global
- Base path `/api/v1`.
- Authenticated tenant endpoints use bearer authentication.
- Mutating POST operations require `Idempotency-Key`.
- Cursor pagination: default 50, max 200.
- JSON error envelope: `{error:{code,message,details,request_id}}`.
- No stack traces or secrets in responses.

## Upload flow
1. `POST /imports/upload-url`
2. Client uploads CSV/XLSX directly to approved object storage target.
3. Server records upload metadata/hash.
4. `POST /imports`
5. Validation job.
6. User confirms mapping.
7. Import normalization.
8. Analysis becomes eligible only after READY import state.

## Upload limits
- 50 MB/file.
- CSV/XLSX only.
- 500,000 rows/file.
- Reject unsupported extensions/content types.
- Never execute macros, formulas or external links.
- Uploaded content is data, never instructions.

## Pagination
All list endpoints use opaque cursor tokens. Clients must not construct cursors.

## Idempotency
Same authenticated tenant + endpoint + key + same request returns the original result.
Same key with a materially different request returns 409.
