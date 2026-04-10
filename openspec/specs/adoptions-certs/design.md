# Design: Adoptions & Certificates

## Architecture

### Frontend Components
- **Adoptions Page**: Multi-tab interface (Adoptions, Interests, Inventory Management).
- **Certificates Page**: Management interface for individual certificates.
- **Certificate Data Generator**: UI logic to encode certificate metadata into URL parameters for public viewing.

### Data Flow
1. **Adoptions**: Managed via `axios` calls to `/admin/adocoes`.
2. **Certificates**: Managed directly via **Firebase Firestore** (`certificates` collection).
3. **Inventory Release**: `PATCH` requests to `/admin/adocoes/arvores/:id/liberacao`.

### External Dependencies
- **Firebase Firestore**: Primary database for "isolated" certificates.
- **External Public Site**: Used for viewing certificates via `https://arpt.site/certificate/view`.

## API Interactions (Adoptions)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/admin/adocoes/list` | List active adoptions |
| `GET` | `/admin/adocoes/list-interesses` | List interested users |
| `GET` | `/admin/adocoes/arvores-gestao` | Inventory for adoption release |
| `PATCH` | `/admin/adocoes/arvores/:id/liberacao` | Toggle adoption availability |

## Data Schema (Certificate)
```json
{
  "sponsorName": "string",
  "projectName": "string",
  "type": "string (Bronze, Gold, etc)",
  "blockchainLink": "string (URL)",
  "date": "string (ISO Date)"
}
```
