# Production Performance Budgets

Initial launch targets:

| Operation | Target | Hard limit |
|---|---:|---:|
| Dashboard initial data API | p95 ≤ 800ms | p95 ≤ 1500ms |
| Standard API request | p95 ≤ 500ms | p95 ≤ 1500ms |
| Upload validation job | ≤ 5 min for 500k rows | 15 min |
| Standard analysis | ≤ 60 sec | 10 min |
| Import queue wait | p95 ≤ 30 sec | 5 min |
| Error rate | < 1% | < 2% |

If real workload proves these targets unsuitable, change them via ADR and load-test evidence.
