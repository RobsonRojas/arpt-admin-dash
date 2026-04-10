# Proposal: System Administration (Payment & Audit)

## Goal
Manage the financial infrastructure and maintain a rigorous audit trail of all administrative actions within the platform.

## Context
The platform acts as a marketplace for sustainable assets. Robust payment splitting and comprehensive auditing are critical for trust, compliance, and disaster recovery.

## Features
- **Marketplace Fee Management**: Global control over transactional fees applied to environmental asset sales.
- **Payment Splitting (MP)**: Integration with Mercado Pago to manage multiple "Sellers" and their specific splitting IDs.
- **Advanced Audit Trail**: Logging of all mutations (CREATE, UPDATE, DELETE) with metadata (User, IP, Timestamp).
- **Automated Rollback**: One-click reversion of data changes found in audit logs, restoring previous states and recording the justification.
- **Visual Diff Engine**: Side-by-side comparison of data objects to identify exactly what changed in a record.
- **Dynamic Entity Mapping**: Centralized mapping of audit logs to business logic controllers for projects, properties, products, and rewards.

## Success Criteria
- Market fees are accurately applied to transactions.
- All sellers are correctly registered and active in the splitting engine.
- 100% visibility into state changes across the application.
- Ability to recover from accidental or malicious data modification through audit logs.
