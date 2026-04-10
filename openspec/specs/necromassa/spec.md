## Purpose
Validate and audit the licensing of fallen wood (necromassa), ensuring legal compliance and fraud prevention.

## Requirements

### Requirement: Volume Calculation
The system MUST automatically calculate wood volume based on manual measurements (length, diameters).

#### Scenario: Submitting a Licensing Request
- **WHEN** a user enters the log dimensions
- **THEN** the system calculates the cubic volume using standard forestry formulas

### Requirement: Geographic Fraud Detection
Licensing requests SHALL be validated against Amazon region boundaries and property coordinates.

#### Scenario: Out of Bounds Validation
- **WHEN** a request is made for coordinates outside the registered management area
- **THEN** the system must flag the request as potentially fraudulent
