# System Architecture

Primary flow:
Browser → authenticated API → application services → database/storage/queue.

Large imports use background workers.
Diagnostic calculations should be deterministic and testable independently of the UI.
AI is an optional explanation service.
