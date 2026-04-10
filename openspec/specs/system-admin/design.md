# Design: System Administration (Payment & Audit)

## Architecture

### Components
- **PaymentConfig**: UI for managing marketplace fees and seller split settings.
- **AuditLogs**: Interface for reviewing system history and performing rollbacks.
- **AuditService**: Library used across all components to capture state changes.

### Data Flow
1. Mutation occurs in any CRUD page (e.g., Projects).
2. `recordAudit` is called with `before` and `after` states.
3. Data is stored in `audit_logs` table (via API).
4. `AuditLogs` page fetches logs and allows `REVERT` actions.

## API Interactions

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/pagamentos/admin/payment-config` | Fetch global fee settings |
| `GET` | `/pagamentos/admin/sellers` | List split-enabled sellers |
| `GET` | `/admin/audit-logs` | Fetch system mutation logs |
| `POST` | `/admin/audit-logs` | Record a new action |
| `PATCH` | `/admin/audit-logs/:id/revert` | Trigger data restoration |

## Data Schema (Audit Log)
```json
{
  "id": "number",
  "action": "string (CREATE|UPDATE|DELETE|REVERT)",
  "entity": "string",
  "before": "object",
  "after": "object",
  "userEmail": "string"
}
```
