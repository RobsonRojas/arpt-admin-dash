## Purpose
Provide a spatial and visual inventory of land plots, including geographic coordinates, legal documentation, and visual records.

## Requirements

### Requirement: Geographic Referencing
Every property MUST be associated with a latitude/longitude point or polygon for map visualization.

#### Scenario: Mapping a New Property
- **WHEN** a property is saved with valid GPS coordinates
- **THEN** it must be correctly rendered on the management map interface

### Requirement: Document and Photo Management
Properties SHALL support the attachment of CAR (Cadastro Ambiental Rural) documentation and field photos.

#### Scenario: Photo Upload Persistence
- **WHEN** a user uploads a management photo to a property
- **THEN** the photo must be stored and linked to the property's visual gallery
