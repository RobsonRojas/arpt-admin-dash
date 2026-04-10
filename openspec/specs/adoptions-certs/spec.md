## Purpose
Manage the final consumption of ecological assets by end-users, including proof-of-impact through certificates.

## Requirements

### Requirement: Asset Adoption Workflow
The system MUST allow for the "adoption" (purchase) of specific trees from the inventory.

#### Scenario: Adopting a Tree
- **WHEN** a user selects a tree and completes the adoption payment
- **THEN** the tree's status must be updated to 'adopted' and linked to the user's account

### Requirement: Digital Certificate Issuance
The system SHALL generate and store public proof-of-adoption certificates.

#### Scenario: Generating a Public Certificate
- **WHEN** an adoption is finalized
- **THEN** a certificate with a unique Base64 ID must be generated and stored in Firestore
