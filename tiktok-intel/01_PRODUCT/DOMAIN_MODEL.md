# Domain Model

## Aggregate hierarchy

Workspace
→ WorkspaceMember
→ Shop
→ Import
→ MappingTemplate
→ NormalizedMetrics
→ BusinessEvent
→ Analysis
→ AnalysisSnapshot
→ Evidence
→ Diagnosis
→ Recommendation
→ Experiment
→ AuditLog

## Ownership
Every tenant-owned entity must resolve to exactly one authorized workspace.

## Immutable entities
- Original import file
- Completed analysis snapshot
- Released diagnostic result

Corrections create a new derived snapshot rather than silently rewriting historical analysis.

## Delete behaviour
Delete semantics must be explicitly defined per entity in the database schema contract.
