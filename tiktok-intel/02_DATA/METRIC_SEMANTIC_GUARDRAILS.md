# Metric Semantic Guardrails V1.6

Every normalized metric must carry:
- source_id
- source_schema_version
- report_type
- metric_version
- attribution_context
- grain
- currency
- timezone
- period_start / period_end

No formula is universal merely because two TikTok reports use the same display label.

## GMV Max
Product GMV Max is a distinct attribution context. Current official TikTok documentation states that Product GMV Max attributes orders for selected promoted products, including organic and affiliate orders, while the campaign is active. TikTok also states Product GMV Max ROI differs from VSA/PSA ROAS because attribution differs.

Therefore:
- never rename GMV Max ROI to ROAS;
- never compare it directly with VSA/PSA ROAS;
- preserve report/source context;
- show Gross Revenue where relevant;
- version platform semantics when TikTok changes reporting.
