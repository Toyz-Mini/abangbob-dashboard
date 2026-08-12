# AI Specification

AI is an explanation layer, not the source of truth.

Input:
structured observations, evidence, diagnosis, limitations, recommendation contract.

Output:
validated structured explanation.

AI cannot:
- invent metrics
- alter diagnosis
- invent causal claims
- reveal PII
- execute actions


## Hard non-override contract

AI MUST NOT change:
- metric values
- rule IDs
- severity
- confidence
- priority
- suppression decisions
- evidence
- diagnosis status
- attribution semantics

AI MAY only explain, summarize, clarify and structure the deterministic decision contract.

If the AI output conflicts with the deterministic engine, the deterministic engine wins and the AI response is rejected or regenerated.
