# Fixtures

`synthetic/` contains synthetic test data and must never be presented as real TikTok exports.
`real/` may only contain authorized user-provided exports.

Every fixture requires: fixture_id, source_id, schema version, file hash, timezone, currency, column inventory, expected mapping and expected normalized output.

Real fixtures are a release prerequisite for the corresponding importer.
