# Supported Source Manifest

This is the launch allowlist. An importer must reject unsupported source formats instead of guessing.

## MVP launch status

| Source | Version | Status |
|---|---|---|
| TikTok Shop manual CSV/XLSX exports | Explicitly verified source variant | SUPPORTED AFTER VALIDATION |
| Unknown CSV/XLSX | Unknown | UNSUPPORTED |
| TikTok API | N/A | FUTURE |
| Arbitrary URL import | N/A | UNSUPPORTED |

Before launch, each concrete TikTok export/report variant must be added with:
source ID, sample fixture, schema version, required columns, optional columns, mapping template, validation rules and golden import test.
