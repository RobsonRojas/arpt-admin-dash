## Purpose
Manage the fine-grained data of individual trees, including their physical measurements, health status, and blockchain-backed history.

## Requirements

### Requirement: Individual Tree Tracking
The system MUST maintain unique identifiers for every tree within a management area.

#### Scenario: Registering a New Tree
- **WHEN** a tree is registered with species, height, and DAP (diameter at chest height)
- **THEN** it must be visible in the inventory list and associated with its parent property

### Requirement: Technical History (Blockchain)
Changes to tree measurements SHALL be logged and potentially hashed for environmental integrity.

#### Scenario: Updating Measurement Data
- **WHEN** a tree's height is updated during a maintenance cycle
- **THEN** the previous measurement must be archived in history and the current value updated
