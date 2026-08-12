# Background Jobs

States:
QUEUED → RUNNING → SUCCEEDED/FAILED/CANCELLED.

Large imports and expensive analysis jobs are asynchronous.
Jobs are idempotent, retryable where safe, observable and cancellable.
Use checkpoints where processing cost warrants resumability.
