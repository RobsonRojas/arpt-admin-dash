# Design: Media Manager

## Architecture

### Components
- **MediaManager Page**: Unified gallery for browsing and uploading assets.
- **MediaCard**: UI unit showing file preview, metadata, and actions (Copy Link, Preview, Download).
- **PreviewDialog**: Multi-format preview engine (Image, generic file icon).

### Data Flow
1. Fetch file manifest via `GET /medias/files`.
2. Construct full URLs using `urlMidiasFiles` base from `AdminContext`.
3. Perform multipart file upload via `POST /medias/upload`.
4. Store files in the storage backend (local file system or cloud).

## API Interactions

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/medias/files` | List all uploaded filenames |
| `POST` | `/medias/upload` | Upload new binary file |

# Tasks: Media Manager
- [x] Initial design of reactive media gallery
- [x] Implementation of multipart file upload engine
- [x] URL copy-to-clipboard functionality
- [x] Integrated image preview modal
- [x] Filename-based search filtering with persistence
- [ ] Add bulk selection and deletion for old assets
- [ ] Implement image optimization (resizing) on upload
- [ ] Add support for drag-and-drop uploads
