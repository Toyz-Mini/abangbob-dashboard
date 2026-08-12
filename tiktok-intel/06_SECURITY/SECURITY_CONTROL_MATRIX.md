# Security Control Matrix

| Threat | Control | Verification |
|---|---|---|
| Cross-tenant access | RLS + authorization | Tenant isolation tests |
| Malicious upload | Allowlist + parser limits + isolation | File security suite |
| Formula injection | Neutralization on export | Export security test |
| XSS | Output encoding/sanitization | XSS tests |
| CSRF | Explicit CSRF strategy | Security tests |
| CORS abuse | Allowlisted origins | Configuration test |
| Secret leakage | Server-side secret management | Secret scan |
| AI prompt injection | Untrusted-data boundary | AI security vectors |
| PII leakage | Minimize/redact AI payload | Privacy tests |
| Abuse/cost exhaustion | Rate limits + quotas | Load/abuse tests |

Every control requires an implementation reference and evidence before production approval.
