# Decision Contract

Every completed analysis resolves to one of:
HEALTHY
PROBLEM_DETECTED
INSUFFICIENT_EVIDENCE
DATA_INVALID
ANOMALY

For PROBLEM_DETECTED:
status
observation
primary diagnosis
evidence
confidence
hypothesis
priority
action
don't_touch
monitor
success_criteria
limitations

Confidence is evidence quality, not probability of causal truth.
Causal claims are forbidden unless supported by an explicit causal method; ordinary diagnoses are observational.
