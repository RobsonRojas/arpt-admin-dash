## Purpose
Maintain the application's central administrative shell, authentication state, and global statistical executive summary.

## Requirements

### Requirement: Unified Auth State
The system MUST maintain a persistent administrative session across reloads using Firebase.

#### Scenario: Session Persistence
- **WHEN** an authenticated user refreshes the browser
- **THEN** the application must maintain the login state and project context

### Requirement: Global KPI Aggregation
The dashboard SHALL aggregate real-time metrics (Area, Investment, Units) from the AdminContext.

#### Scenario: Loading Dashboard Stats
- **WHEN** the dashboard page is mounted
- **THEN** it must fetch and display the latest counters for total forest impact
