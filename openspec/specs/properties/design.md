# Design: Property Management

## Architecture

### Frontend Components
- **Properties Page**: Main dashboard for property management.
- **Property Form Dialog**: Form for creating/editing properties with validation.
- **Property Details Drawer**: Side drawer for viewing property info, map, and photo.
- **InventoryManager**: Full-screen modal for managing tree inventory (shared with Inventory module).
- **AIAssistant**: Integration for smart field suggestions.

### Data Flow
1. `AdminContext` fetches properties via `GET /propriedades`.
2. Property photos are uploaded to `/medias/upload` (for file storage) and then registered in `POST /lugarfotos`.
3. Property updates use `PUT /propriedades/:id` (managed via `handleUpdateProperty`).

### External Dependencies
- **Material-UI**: Component library.
- **React-Leaflet**: Mapping component.

## API Interactions

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/propriedades` | List all properties |
| `POST` | `/propriedades` | Register property |
| `PUT` | `/propriedades/:id` | Update property |
| `POST` | `/medias/upload` | File upload service |
| `POST` | `/lugarfotos` | Register photo metadata |

## Data Schema
```json
{
  "id": "number",
  "name": "string",
  "car": "string",
  "latitude": "number",
  "longitude": "number",
  "area_he": "number",
  "image_internal_path": "string"
}
```
