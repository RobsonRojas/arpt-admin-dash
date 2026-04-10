## Purpose
Bridge the gap between technical forest inventory and commercial offerings, allowing the tokenization and sale of sustainable assets.

## Requirements

### Requirement: Product Metadata Management
The system MUST manage product templates (Title, Description, Price) that serve as blueprints for rewards.

#### Scenario: Creating a Global Product
- **WHEN** an admin creates a "Mogno" product with specific pricing
- **THEN** it becomes available to be instantiated as a reward in any management unit

### Requirement: Reward Lifecycle
Rewards SHALL represent a specific instance of a product tied to a specific project.

#### Scenario: Linking Reward to Project
- **WHEN** a reward is created for "Project X" based on the "Mogno" product
- **THEN** sales of this reward must be tracked against Project X's inventory
