# Attribution Specification

Supported attribution labels:
SHOP_TOTAL, PAID, ORGANIC, GMV_MAX, LIVE, AFFILIATE, UNKNOWN.

Rules:
- Do not add incompatible attribution totals.
- Preserve source attribution metadata.
- Show attribution context next to relevant metrics.
- If attribution is unknown, downgrade confidence.
- Never silently convert GMV Max ROI into paid-only ROAS.
