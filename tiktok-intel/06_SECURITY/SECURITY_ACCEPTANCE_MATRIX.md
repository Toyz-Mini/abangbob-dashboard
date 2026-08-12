# Security Acceptance Matrix

A release is blocked by any unresolved Critical/High security finding.

Required:
- SEC-AUTH-001: unauthenticated API rejected
- SEC-AUTHZ-001: unauthorized workspace access rejected
- SEC-RLS-001: direct DB cross-tenant read rejected
- SEC-RLS-002: direct DB cross-tenant write rejected
- SEC-FILE-001: executable/macro payload rejected
- SEC-FILE-002: oversized file rejected
- SEC-FILE-003: zip/resource bomb rejected
- SEC-XSS-001: uploaded text cannot execute
- SEC-CSV-001: formula injection neutralized on export
- SEC-CSRF-001: cross-site state-changing request rejected
- SEC-CORS-001: unapproved origin rejected
- SEC-SECRET-001: secrets absent from client bundle/logs
- SEC-AI-001: prompt injection does not alter decision contract
- SEC-PII-001: unnecessary PII absent from AI payload
