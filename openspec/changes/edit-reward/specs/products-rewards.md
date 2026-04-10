## ADDED Requirements

### Requirement: Dynamic Product Reassignment
The system MUST allow users to change the product associated with an existing reward during the edit operation.

#### Scenario: Changing Reward Product
- **WHEN** an admin selects a different product from the dropdown in the Edit Reward dialog
- **THEN** the "Dados do Produto Selecionado" box must update immediately to reflect the new selection
- **AND** clicking "Atualizar" must persist the new product association in the backend
