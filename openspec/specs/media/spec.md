## Purpose
Provide a centralized repository for technical assets, including photos, contracts, and certificates.

## Requirements

### Requirement: Multipart File Upload
The system MUST support the upload of binary files through the administrative interface.

#### Scenario: Uploading a technical PDF
- **WHEN** a user selects a PDF document and clicks 'Upload'
- **THEN** the file must be stored on the server and a public URL generated for referencing

### Requirement: Asset Discovery
Administrators SHALL be able to search and retrieve asset URLs for use in other modules.

#### Scenario: Copying Image Link
- **WHEN** an admin clicks the 'Copy Link' icon on a media card
- **THEN** the full asset URL must be copied to the clipboard for external use
