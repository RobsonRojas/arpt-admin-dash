# Design: Necromassa Licensing

## Architecture

### Frontend Components
- **Necromassa Page**: Dashboard showing all licensing requests with status indicators.
- **Input Técnico Form**: Dialog for inputting field data (Assentado, Species, CAP, Height, Coords).
- **Audit Drawer**: Detailed view for reviewing coordinate mapping and fraud alerts.

### Logic & Calculations
- **Volume Formula**: `(PI * (CAP/PI)^2 / 40000) * Altura * FF` (Form Factor from `SPECIES_DB`).
- **Validation Rules**:
  - Coords within Amazon bounding box: `latitude [5, -15]`, `longitude [-40, -75]`.
  - Mandatory Root Evidence: Checked via `fotoRaiz` switch.

### Data Flow
1. Technical data is manually entered (often transcribed from WhatsApp).
2. UI calculates volume and triggers alerts in real-time.
3. `AdminContext` stores the requests (currently using initialized mock data and `handleAddNecromassa`).

## API (Currently identified endpoints)
- Note: This module currently relies on local context state but is designed for:
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/necromassa` | Fetch requests (Planned/TBD) |
| `POST` | `/necromassa` | Submit new request (Planned/TBD) |

## Data Schema
```json
{
  "id": "string",
  "solicitante": "string",
  "especie_vulgar": "string",
  "volume": "number",
  "coords": { "lat": "number", "lng": "number" },
  "status": "string",
  "alerts": "array of strings"
}
```
