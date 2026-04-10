# Design: Dashboard & Core

## Architecture

### Central Services
- **AuthContext**: Manages Firebase login state, token extraction, and user profiles.
- **AdminContext**: Central state machine for all administrative entity CRUD and business logic.
- **AppShell**: Root layout component with responsive navigation and protection for authenticated routes.

### Components
- **Dashboard Page**: High-level statistical greeting page.
- **StatCard**: Presentation component for KPI data.
- **AIAssistant**: Global component for refining content using Gemini.

### Data Flow
1. `AuthContext` verifies credentials with Firebase.
2. `AdminContext` initializes once authenticated, fetching base data (Projects, Users).
3. `Dashboard` consumes aggregated data from `AdminContext` to render StatCards.

# Tasks: Dashboard & Core
- [x] Initial design of executive statistical dashboard
- [x] Implementation of `StatCard` visualization components
- [x] Responsive administrative sidebar and top bar implementation
- [x] Firebase authentication integration and route protection
- [x] Centralization of business logic inside `AdminContext`
- [x] Implementation of global loading states and error boundaries
- [ ] Add dark mode support to the entire admin shell
- [ ] Implement user preference storage (sidebar collapsed/expanded)
