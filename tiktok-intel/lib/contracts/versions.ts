/**
 * Versioned contract identifiers.
 *
 * Every analysis snapshot persists these values so a diagnosis can be
 * reproduced exactly (01_PRODUCT/PRD.md — "Preserve reproducibility").
 *
 * Changing any value here is a contract change: it requires an ADR and a
 * golden-vector regression run (03_INTELLIGENCE/P0_RULE_CATALOG_V1.json —
 * threshold_policy).
 */

/** Canonical metric semantics version (02_DATA/METRIC_CHANGE_CONTROL.md). */
export const METRIC_VERSION = '1.6.0'

/** Rule thresholds/triggers version (03_INTELLIGENCE/P0_RULE_CATALOG_V1.json). */
export const RULE_SET_VERSION = '1.4.0'

/** Engine pipeline/scoring version (03_INTELLIGENCE/DIAGNOSTIC_ENGINE_SPEC.md). */
export const DIAGNOSTIC_ENGINE_VERSION = '1.7.0'

/** Structured AI explanation schema version (05_AI/AI_OUTPUT_SCHEMA.md). */
export const AI_SCHEMA_VERSION = '1.0.0'

/** Confidence weighting version (03_INTELLIGENCE/CONFIDENCE_MODEL.md). */
export const CONFIDENCE_MODEL_VERSION = '1.0.0'

/** Health score weighting version (03_INTELLIGENCE/HEALTH_SCORE_SPEC.md). */
export const HEALTH_SCORE_VERSION = '1.0.0'

export const API_VERSION = 'v1'
