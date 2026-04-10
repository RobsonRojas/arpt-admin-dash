# Proposal: Dashboard & Core

## Goal
Provide a high-level executive summary of the forest management operation and maintain the central security and business logic infrastructure of the application.

## Context
The Dashboard is the first point of contact for administrators, providing immediate visibility into critical metrics. The Core infrastructure (Auth, Contexts, Shell) ensures system stability and secure data access across all modules.

## Features
- **Executive Stat Cards**: Real-time counters for Total Managed Area, Capital Investment, Pending Actions, and Tokenized RWA assets.
- **Unified Auth Shell**: Secure application wrapper providing Firebase authentication and role-based navigation.
- **Centralized Admin Context**: Shared state management and business logic hub for all CRUD operations.
- **Global Error Boundary**: Robust error handling to maintain application availability during individual component failures.
- **Mobile-Responsive Shell**: adaptive navigation drawer and layout for field use on mobile devices.

## Success Criteria
- Instant visibility into the platform's key performance indicators (KPIs).
- Reliable authentication and persistence across browser sessions.
- Efficient state sharing between distant components via AdminContext.
