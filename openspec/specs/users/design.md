# Design: User Management

## Architecture

### Frontend Components
- **Users Page**: Main management table with search and filters.
- **User Detail Dialog**: Comprehensive view of user metadata, rewards, and certs.
- **Reward History Modal**: Specialized tool for building the "story" of a purchased tree.
- **History Sync Tool**: Logic to fetch technical updates from a tree and convert them to story parts.

### Data Flow
1. Fetch users via `GET /admin/users`.
2. Fetch user rewards/purchases via `GET /admin/users/:id/purchases`.
3. Manage storytelling parts via `POST /produtos/admin/purchases/:id/history`.
4. Sync history from tree measurements via `POST /produtos/admin/purchases/:id/history/sync`.

### External Dependencies
- **Firebase Auth**: User identity management.
- **QRCode.react**: For generating shareable QR codes.
- **Google Gemini (Indirect)**: Used for syncing and summarizing history parts.

## API Interactions

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/admin/users` | List all users |
| `GET` | `/admin/users/:id/purchases` | Fetch user purchase history |
| `POST` | `/produtos/admin/purchases/:id/history` | Add story part |
| `POST` | `/produtos/admin/purchases/:id/history/sync` | Sync data from associated tree |
| `PATCH` | `/produtos/admin/purchases/:id/toggle-history` | Toggle public visibility |

## Data Schema (History Part)
```json
{
  "id": "number",
  "titulo": "string",
  "descricao": "string",
  "media_url": "string",
  "ordem": "number"
}
```
