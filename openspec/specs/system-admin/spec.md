## Purpose
Maintain the platform's financial configuration and ensure data integrity through a rigorous audit trail and fallback mechanisms.

## Requirements

### Requirement: Payment Splitting Configuration
The system MUST support the definition of marketplace fees and seller split IDs (Mercado Pago).

#### Scenario: Updating Marketplace Fee
- **WHEN** the global fee is changed from 10% to 15%
- **THEN** all subsequent transactions must use the new fee for split calculation

### Requirement: Data Change Auditing
All mutations to core entities (Projects, properties, etc.) SHALL be recorded with before/after states.

#### Scenario: Reverting a Change
- **WHEN** an admin selects an 'UPDATE' log entry and provides a justification
- **THEN** the system must restore the 'before' state and log a 'REVERT' action
