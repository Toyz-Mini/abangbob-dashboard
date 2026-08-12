# TikTok Export Specification

Launch support must be explicitly enumerated before importer release.

Each supported export requires:
source_id, export name, file type, grain, date field, primary key/natural key, required columns, optional columns, aliases, currency, attribution type, aggregation rules, known caveats, verification date and schema version.

Unsupported exports must produce a clear unsupported-source message rather than best-effort guessing.
