# Proposal: Project Management (Manejos)

## Goal
Provide a comprehensive administrative interface for managing forest management projects (Manejos). This includes tracking project status, location, size, and harvesting details.

## Context
Forest management projects are the core entity of the ARPT platform. They represent the actual areas where sustainable harvesting or reforestation activities take place.

## Features
- **Project Listing**: View a sortable and searchable list of all projects.
- **Project Creation/Edition**: Managed via a multi-step wizard (`FieldAppEmbedded`) or simplified form.
- **Detailed View**: Side drawer showing project metrics, location (map), and related entities.
- **Status Lifecycle**: Projects transition through defined states (e.g., "Em breve", "Inventariado", "Em captação").
- **Geospatial Tracking**: Map integration to visualize project boundaries and location.

## Success Criteria
- Administrators can easily find and update project information.
- All project changes are tracked via Audit Logs.
- Data consistency between the frontend and the backend API (Firebase-authenticated).
