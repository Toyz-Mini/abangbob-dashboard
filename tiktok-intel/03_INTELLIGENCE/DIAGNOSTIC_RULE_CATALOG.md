# Diagnostic Rule Catalog

This document is the authoritative list of production rules.

Each P0 rule must define:
1. Rule ID
2. Version
3. Required inputs
4. Minimum sample
5. Baseline requirement
6. Exact trigger
7. Counter-evidence
8. Confounders
9. Suppression rules
10. Precedence
11. Severity
12. Confidence formula
13. Evidence payload
14. Observation
15. Diagnosis
16. Hypothesis
17. Recommendation
18. Don't-touch
19. Monitor metrics
20. Success criteria
21. Limitations
22. Golden test vector IDs

No rule may ship with an undefined threshold.

## Precedence principle

Data invalidity and strong confounders can suppress downstream behavioural diagnoses.

Example:
DATA_INVALID > STOCKOUT_CONFOUNDER > ANOMALY > FUNNEL_DIAGNOSIS.

The exact precedence table must be versioned.
