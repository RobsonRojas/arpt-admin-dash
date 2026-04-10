# Design: Products & Rewards

## Architecture

### Frontend Components
- **Products Page**: Management of the global product catalog.
- **Rewards Page**: Management of project-specific commercial offerings.
- **RewardList**: Modular list of rewards for a selected project.
- **RewardFormDialog**: Specialized form for assigning products to projects.
- **AIAssistant**: Integration for translating and refining descriptions.

### Persistence Hook (`usePersistence`)
- Custom hook used to store form drafts in `localStorage` keyed by `persistenceKey`.
- Automatically restores state on component mount.
- Clears draft on successful save.

### Data Flow
1. **Products**: `AdminContext` (or local state in `Products.jsx`) fetches from `GET /produtos`.
2. **Rewards**: User selects a project; Frontend calls `GET /manejos/:id/produtos`.
3. Save operation calls `POST /produtos` or `POST /manejos/:id/produtos`.
4. Audit Log tracks each change via `recordAudit` service.

## API Interactions

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/produtos` | List global products |
| `POST` | `/produtos` | Create product |
| `PUT` | `/produtos/:id` | Update product |
| `GET` | `/manejos/:id/produtos` | List rewards for a project |
| `POST` | `/manejos/:id/produtos` | Add reward to project |
| `PUT` | `/manejos/:id/produtos/:rid` | Update reward |

## Data Schema (Product)
```json
{
  "id": "number",
  "nome": "string",
  "preco": "number",
  "is_ativo": "boolean",
  "fotos": "array"
}
```
