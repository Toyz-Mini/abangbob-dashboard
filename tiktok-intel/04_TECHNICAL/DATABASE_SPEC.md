# Database Specification

Core entities:
workspace, workspace_member, shop, import, import_file, mapping_template, normalized_metric, business_event, analysis, analysis_snapshot, evidence, diagnosis, recommendation, experiment, audit_log, job.

Every field requires type/nullability/default/index/FK/constraint/RLS/retention semantics before implementation.

Tenant ownership must be explicit through workspace/shop relationships.
