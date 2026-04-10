## Purpose
Formalize the management of forest units, ensuring accurate tracking of management areas, financial headers, and their active/inactive status.

## Requirements

### Requirement: Project Lifecycle Management
The system MUST allow administrators to create, read, update, and manage the lifecycle of forest management projects.

#### Scenario: Administrative Project Creation
- **WHEN** an admin submits a new project with name, area, and financial data
- **THEN** the system persists the project and makes it available for property association

### Requirement: Financial Header Integration
Projects SHALL contain financial metadata (investimento) to track total capital allocation across management units.

#### Scenario: Financial Data Update
- **WHEN** the "investimento" field is updated in a project
- **THEN** the global dashboard statistics must reflect the change upon refresh
