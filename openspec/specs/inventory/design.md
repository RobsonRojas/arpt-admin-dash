# Design: Tree Inventory

## Architecture

### Components
- **InventoryManager**: Main full-screen orchestrator for tree data.
- **TreeRow**: Individual row component with actions (Edit, History, AI Doc, Photos).
- **TreeForm**: Complex form for measuring and classifying trees.
- **ConfirmationView**: Diff-comparison screen for verifying edits.
- **BulkUploadDialog**: Interface for dragging multiple photos for automatic matching.

### Data Flow
1. Fetch all property inventories via `GET /propriedades/:id/inventarios`.
2. Fetch trees bath-by-batch (100 per page) via `GET /propriedades/:id/arvores`.
3. Perform frontend-side filtering and sorting for performance.
4. Update/Create via `POST /arvores` and `PUT /arvores/:id`.

### Advanced Integrations
- **AI Document Generation**: Calls `generateDocument` service which interacts with Google Gemini.
- **Blockchain**: Fetches transaction history via `GET /arvores/:id/transactions`.
- **Bulk Media**: Maps files to `id` by identifying numeric prefixes in filenames.

## API Interactions

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/propriedades/:id/arvores` | Fetch tree list |
| `POST` | `/arvores` | Register new tree |
| `PUT` | `/arvores/:id` | Update tree data |
| `GET` | `/arvores/:id/photos` | List tree photos |
| `GET` | `/arvores/:id/transactions` | Blockchain audit trail |
| `GET` | `/inventarios/arvores/:id/documento` | Download ODT report |

## Data Schema (Tree)
```json
{
  "id": "number",
  "number": "number",
  "specieName": "string",
  "dap": "number",
  "volume": "number",
  "latitude": "number",
  "longitude": "number"
}
```
