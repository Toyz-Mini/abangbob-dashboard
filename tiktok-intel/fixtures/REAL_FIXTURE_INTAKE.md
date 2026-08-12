# Real TikTok Fixture Intake

Real fixtures cannot be fabricated by the documentation process.

Before importer certification, obtain an authorized export for each supported source/report type.

Required metadata:
- fixture_id
- source_id
- report_type
- source_schema_version
- export date
- shop timezone
- currency
- SHA-256
- authorization status
- redaction status
- column inventory
- expected mapping
- expected normalized output

Release rule:
No importer is marked production-ready until its real fixture suite passes parser, mapping, validation and normalization regression tests.
