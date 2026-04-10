## Purpose
Track high-value partnerships and Real World Asset (RWA) deals, focusing on corporate environmental sponsorship.

## Requirements

### Requirement: Deal Tracking
The system MUST log sponsorship deals with metadata about the partner and the project involved.

#### Scenario: Registering a New Sponsor
- **WHEN** a partnership is registered with corporate tax ID and logo
- **THEN** it must be visible in the partners gallery and linked to at least one project

### Requirement: RWA Asset Linkage
Sponsorships SHALL be linked to tokenized assets (RWA) for financial reporting.

#### Scenario: Auditing Sponsor Revenue
- **WHEN** a revenue report is generated for a project
- **THEN** it must include contributions from all registered sponsors
