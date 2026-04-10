# Proposal: AI Configuration (Gemini)

## Goal
Manage the selection and priority of Google Gemini AI models used for document generation and commercial description enhancement.

## Context
AI is core to automating forest inventory reports and product descriptions. Managing model fallback ensures system resilience against API quota limits or service interruptions.

## Features
- **Model Registry**: Management of available Gemini models (e.g., Flash, Pro).
- **Fallback Strategy**: Drag-and-drop prioritization to define which model to use as a primary and which ones to use as backup.
- **Dynamic Activation**: One-click toggle to enable or disable specific AI models globally.
- **Quota Resilience**: Automated transition between models based on the configured priority list.
- **Cloud Persistence**: Centralized settings storage in Firestore for instant application across all instances.

## Success Criteria
- Primary AI tasks (report generation) use the highest-priority enabled model.
- Transparent fallback between models occurs without administrative intervention.
- AI Assistant features in Products/Inventory remain operational during individual model outages.
