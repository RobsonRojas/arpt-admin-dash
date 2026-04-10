# Design: AI Configuration (Gemini)

## Architecture

### Components
- **GeminiSettings Page**: Interface for reordering and toggling models.
- **Gemini Service**: Frontend library for calling the AI endpoints with fallback logic.

### Data Flow
1. Fetch model list from `settings/gemini` in Firestore.
2. User reorders models (updating `priority` field).
3. `saveModelConfig` updates the Firestore document.
4. Future AI calls (Inventory report, Product descriptions) read this config to determine which model ID to use.

## Configuration Schema
```json
{
  "models": [
    { "id": "string", "name": "string", "enabled": "boolean", "priority": "number" }
  ]
}
```
# Tasks: AI Configuration
- [x] Firestore-backed settings storage
- [x] Toggle interface for individual models
- [x] Priority reordering logic with automatic re-indexing
- [x] Integrated fallback resilience in AI assistant components
- [x] Support for legacy Gemini model ID migration
- [ ] Implement usage cost estimator based on token counts
- [ ] Add field for custom system prompts per model
