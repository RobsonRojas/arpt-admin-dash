## Purpose
Manage the selection and fallback order of AI models (Gemini) used for strategic insights and document generation.

## Requirements

### Requirement: Model Prioritization
The system MUST allow administrators to define a prioritized list of enabled AI models.

#### Scenario: Fallback during Service Outage
- **WHEN** the primary AI model (P1) returns a quota error
- **THEN** the system must automatically attempt the request using the next prioritized model (P2)

### Requirement: Persistence of AI Settings
AI model availability toggles and priority levels SHALL be persisted in a centralized configuration.

#### Scenario: Enabling a New Model
- **WHEN** a new Gemini model is toggled to 'enabled' in settings
- **THEN** it must immediately become eligible for use in the production environment
