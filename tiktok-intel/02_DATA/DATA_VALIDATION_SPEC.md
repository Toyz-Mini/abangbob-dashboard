# Data Validation Specification

Validation layers:
1. File
2. Schema
3. Type
4. Range
5. Grain/key
6. Date
7. Currency
8. Attribution
9. Cross-field consistency
10. Reconciliation

Examples:
- orders >= 0
- spend >= 0
- GMV >= 0
- rates within valid source-defined bounds
- no duplicate natural keys
- no mixed currencies in one analysis unless explicitly converted
