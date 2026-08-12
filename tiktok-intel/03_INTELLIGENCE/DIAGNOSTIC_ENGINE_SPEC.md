# Diagnostic Engine Specification

The diagnostic engine is deterministic and evidence-first.

Pipeline:
normalized data → metric engine → baseline → signal detection → confounder detection → rule evaluation → suppression/precedence → priority → decision contract.

AI is downstream and cannot modify structured diagnosis fields.
