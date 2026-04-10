## Purpose
Manage system access through Role-Based Access Control (RBAC) and provide a personalized storytelling experience for asset adopters.

## Requirements

### Requirement: RBAC Security
The system MUST enforce roles (Admin, Gestor, Operador, Visualizador) to restrict access to sensitive configurations.

#### Scenario: Administrative Access
- **WHEN** a user with 'Admin' role attempts to change payment configurations
- **THEN** the request must be authorized by the system

### Requirement: User Revenue Visibility
Users SHALL be able to view their specific reward history and the "story" of their adopted trees.

#### Scenario: Syncing Story from Technical Data
- **WHEN** a tech update is logged for a tree (e.g., measurement)
- **THEN** the system must provide a tool to sync this data into the user's public history
