# Design: Sponsors (RWA)

## Architecture

### Frontend Components
- **Sponsors Page**: Dashboard for managing capital partners.
- **Sponsor Deal Form**: Dialog for inputting new sponsorship details.
- **Sponsor Details Drawer**: Interface for detailed sponsor auditing.

### Data Flow
1. Fetch sponsors via `useAdmin` hook (connected to `AdminContext`).
2. New deals are stored locally with persistence via `usePersistence`.
3. Save operation currently mocks the data persistence (planned for `POST /sponsors`).

## API Interactions (Conceptual)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/sponsors` | Fetch sponsor list |
| `POST` | `/sponsorship-deals` | Register new contribution |
| `PUT` | `/sponsors/:id` | Update sponsor profile |

## Data Schema
```json
{
  "id": "number",
  "nome": "string",
  "nivel": "string",
  "total_patrocinado": "number",
  "tipo": "string"
}
```
