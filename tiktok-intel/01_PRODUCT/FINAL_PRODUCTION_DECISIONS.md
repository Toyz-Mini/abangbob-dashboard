# Final Production Decisions V1.4

These decisions remove avoidable ambiguity for implementation.

| Decision | Final default | Rationale |
|---|---|---|
| MVP ingestion | Manual CSV/XLSX | Validate product value before API dependency |
| Database | PostgreSQL via Supabase | Existing project architecture and RLS |
| Frontend | Next.js/TypeScript | Existing implementation direction |
| Background jobs | Queue/worker abstraction | Large imports and analysis must not block requests |
| IDs | UUID | Tenant-safe identifiers |
| Money | PostgreSQL NUMERIC | No floating-point persistence |
| Time storage | UTC timestamps + shop timezone | Correct business-day reporting |
| Default Malaysia timezone | Asia/Kuala_Lumpur | Initial market |
| API version | `/api/v1` | Explicit contract versioning |
| Pagination | Cursor-based for collections | Stable under mutation |
| Default page size | 50 | Predictable payload size |
| Maximum page size | 200 | Abuse protection |
| Idempotency | Required for mutating async operations | Prevent duplicates |
| Analysis snapshots | Immutable | Reproducibility |
| AI role | Explanation only | Deterministic source of truth |
| AI failure behaviour | Structured deterministic explanation fallback | Product remains useful |
| Default upload max | 50 MB | Initial safe operational limit |
| Default rows/file | 500,000 | Initial capacity target |
| Concurrent imports/shop | 2 | Protect DB/worker resources |
| Import job timeout | 15 min | Fail safely; large jobs must be chunked |
| API request timeout | 30 sec | Long work moves to jobs |
| Analysis job timeout | 10 min | Prevent stuck jobs |
| Raw file retention | 90 days | Operationally useful; configurable |
| Analysis snapshot retention | 24 months | Preserve business history |
| Audit retention | 24 months | Operational/accountability baseline |
| Backup RPO target | ≤ 24 hours | Initial MVP target |
| Backup RTO target | ≤ 4 hours | Initial MVP target |
| AI per-analysis budget | configurable hard cap | Cost safety |
| AI regeneration | max 3 per analysis / 24h | Abuse protection |
| Unsupported source | Reject, never guess | Data correctness |
| Unknown metric | Reject or map manually | No silent semantics |
| Arbitrary URL import | Not supported | Removes SSRF surface |
| Automatic TikTok API | Future | Not an MVP dependency |

These defaults may be changed only through an ADR and corresponding impact/regression review.
