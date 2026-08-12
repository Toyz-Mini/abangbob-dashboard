# API Specification

Every endpoint specifies:
method, path, auth, authorization, request schema, response schema, validation, error codes, idempotency, rate limits and audit requirements.

Core endpoints:
POST /api/imports
POST /api/imports/{id}/validate
POST /api/imports/{id}/confirm
POST /api/analyses
GET /api/analyses/{id}
POST /api/diagnoses/{id}/explain
POST /api/experiments
