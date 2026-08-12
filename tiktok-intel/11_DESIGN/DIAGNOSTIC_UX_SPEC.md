# Diagnostic UX Specification V1.7

## Core UX principle

The system should never say:

> "Your performance is bad."

It should say:

> **What changed + evidence + likely cause + action.**

## Diagnosis anatomy

### 1. Headline
Example:
`Conversion dropped 18% after traffic remained stable`

### 2. Impact
`Estimated GMV impact: RM 4,820`

If impact cannot be reliably estimated:
`Impact: material, estimate unavailable`

### 3. Confidence
High / Medium / Low.

Confidence must come from deterministic evidence rules, not AI confidence.

### 4. Evidence
Show the actual metrics.

### 5. Confounders
Examples:
- insufficient sample
- stockout
- incomplete data
- attribution change
- date coverage mismatch

### 6. Recommendation
One primary action.

### 7. Don't touch
Explicitly identify healthy areas that should not be changed.

### 8. Monitor
Define what to watch and when.

### 9. Experiment
Optional structured hypothesis.

## Priority ordering

Priority score considers:
- impact
- confidence
- urgency
- controllability
- data quality

A low-confidence diagnosis must not outrank a high-confidence high-impact diagnosis without explicit product rules.

## AI

AI can explain the deterministic diagnosis.

AI cannot:
- invent evidence
- alter severity
- change priority
- introduce a new diagnosis
- change metrics
