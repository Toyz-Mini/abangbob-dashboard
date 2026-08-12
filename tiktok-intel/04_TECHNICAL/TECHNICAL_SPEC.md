# Technical Specification

Recommended layers:
Web UI → API/application services → domain services → data/queue/storage → external providers.

Core domain services:
ImportService, MappingService, ValidationService, MetricService, DiagnosticService, RecommendationService, ExperimentService, ReportService, AIExplanationService.

No domain rule should live only inside UI components.
