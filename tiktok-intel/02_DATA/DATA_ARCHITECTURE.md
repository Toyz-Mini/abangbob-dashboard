# Data Architecture

## Lifecycle
Upload → quarantine → security validation → parse → dataset detection → mapping → validation → normalization → reconciliation → ready → analysis snapshot → diagnosis → retention/deletion.

## Layers
1. Raw source file
2. Parsed source rows
3. Normalized facts
4. Derived metrics
5. Evidence
6. Diagnosis
7. Recommendation
8. Experiment outcome

Raw source files are immutable until retention deletion.
Derived analysis snapshots are immutable.
