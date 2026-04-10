# Design: Forest Intelligence (MUSA)

## Architecture

### Components
- **ForestIntelligence Page**: High-level dashboard for strategic metrics.
- **AnalysisCard**: Reusable container for charts with built-in AI insight section.
- **Recharts Integration**: Library for rendering Bar and Pie charts from processed data.

### Data Flow
1. Fetch aggregated forest metrics from the backend (or process local inventory data).
2. UI displays "Generating Analysis" state while AI (Gemini) processes insights.
3. Final rendered state combines charts with natural language strategic guidance.

## Metrics & KPIs
- **Yield (m³)**: Predicted vs Realized per year.
- **Diversity Index**: Percentage of area occupied by each commercial species.
- **Valuation (BRL)**: Biological asset value growth (Quarterly/Annual).

## Data Schema (Conceptual Analytics)
```json
{
  "yield": [
    { "year": "number", "predicted": "number", "actual": "number" }
  ],
  "species": [
    { "name": "string", "count": "number", "percentage": "number" }
  ],
  "valuation": {
    "current": "number",
    "growth_quarter": "number"
  }
}
```
