# Design: Project Management (Manejos)

## Architecture

### Frontend Components
- **Projects Page**: Main container utilizing `useAdmin` hook for data fetching and state.
- **ProjectToolbar**: Controls for searching, filtering, and adding new projects.
- **ProjectTable**: Data grid for desktop view with sorting and actions.
- **ProjectMobileCards**: Responsive card layout for mobile devices.
- **ProjectDetailsDrawer**: Detailed side-view for specific project metadata.
- **FieldAppEmbedded**: Wizard component for complex project data entry.

### Data Flow
1. User enters the Projects page.
2. `AdminContext` fetches projects from `GET /manejos`.
3. State is stored in `projects` array and rendered via `ProjectTable`/`ProjectMobileCards`.
4. Actions (create/update) trigger `handleSaveProject` in `AdminContext`.
5. API calls are made via `api.js` (Axios) with Firebase ID tokens.
6. Successful mutations trigger a local state refresh and an Audit Log entry.

### External Dependencies
- **Material-UI**: Components for Table, Drawer, and Toolbar.
- **Leaflet/React-Leaflet**: Geospatial visualization (via `MapEmbed`).
- **Firebase Auth**: Authentication and token management.

## API Interactions

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/manejos` | Fetch all projects |
| `POST` | `/manejos` | Create a new project |
| `PUT` | `/manejos/:id` | Update project details |
| `GET` | `/manejos/states` | Fetch available project statuses |

## Data Schema (Frontend normalization)
```json
{
  "id": "number",
  "descricao": "string",
  "id_status": "number",
  "tamanho": "number",
  "latitude": "number",
  "longitude": "number",
  "fotos": "array of objects"
}
```
