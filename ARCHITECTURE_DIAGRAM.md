# Module Upload Architecture

## System Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      TEACHER SIDE                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  view-subject.html (Module Modal)                                │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Title Input                                              │   │
│  │ Description Textarea                                     │   │
│  │ File Type Select                                         │   │
│  │ File Upload Area (Multiple) ◀─────────┐                 │   │
│  │ ┌──────────────────────────────────┐  │                 │   │
│  │ │ Selected Files List              │  │                 │   │
│  │ │ - file1.pdf [Remove]             │  │                 │   │
│  │ │ - file2.mp4 [Remove]             │  │                 │   │
│  │ │ - file3.jpg [Remove]             │  │                 │   │
│  │ └──────────────────────────────────┘  │                 │   │
│  │ [Cancel] [Save Module]                │                 │   │
│  └──────────────────────────────────────┼─────────────────┘   │
│                                          │                      │
│                    ApiService.js         │                      │
│                    (createModule())◄─────┘                      │
│                                                                  │
└──────────────────────┬───────────────────────────────────────────┘
                       │
                       │ POST /api/v1/modules
                       │ FormData with file(s)
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND SERVER                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  routes/modules.js                                               │
│  POST /:  upload.single('file') → moduleController.create()     │
│                                                                  │
│  moduleController.js                                             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 1. Validate request (subject_id, title required)        │   │
│  │ 2. Create module in DB                                  │   │
│  │ 3. If file uploaded:                                    │   │
│  │    - Save file to /uploads/                             │   │
│  │    - Call Module.addModuleFile()                        │   │
│  │ 4. Mark as synced (if auto-sync enabled)                │   │
│  │ 5. Return module with files array                       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Database                                                        │
│  ┌─────────────────────┐    ┌─────────────────────┐            │
│  │   modules           │    │   module_files      │            │
│  ├─────────────────────┤    ├─────────────────────┤            │
│  │ id (PK)             │    │ id (PK)             │            │
│  │ title               │◄───│ module_id (FK)      │            │
│  │ content             │    │ file_name           │            │
│  │ file_type           │    │ file_path           │            │
│  │ is_synced           │    │ file_type           │            │
│  └─────────────────────┘    │ file_size           │            │
│                              │ original_name       │            │
│                              │ is_active           │            │
│                              └─────────────────────┘            │
│                                                                  │
│  File System                                                     │
│  /uploads/                                                       │
│  ├── module-1704067200000-lesson.pdf                            │
│  ├── module-1704067201000-video.mp4                             │
│  └── module-1704067202000-image.jpg                             │
│                                                                  │
└──────────────────────┬───────────────────────────────────────────┘
                       │
                       │ Response: { module, files: [...] }
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                      STUDENT SIDE                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  studentViewModules.html                                         │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Module View Modal                                        │   │
│  │                                                          │   │
│  │ Title: "Algebra Fundamentals"                            │   │
│  │ Description: "Learn algebra basics"                      │   │
│  │                                                          │   │
│  │ Module Files:                                            │   │
│  │ ┌────────────────────────────────────────────────────┐   │   │
│  │ │ 📄 lesson.pdf           [Preview] [Download] ◄─┐  │   │   │
│  │ │ 🎥 video.mp4            [Preview] [Download]  │  │   │   │
│  │ │ 🖼️  image.jpg           [Preview] [Download]  │  │   │   │
│  │ └────────────────────────────────────────────────────┘   │   │
│  └──────────────────────────────┬─────────────────────────────┘   │
│                                 │                                  │
│                      Click [Preview]                               │
│                                 │                                  │
│                                 ▼                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ File Preview Modal                                       │   │
│  │                                                          │   │
│  │ For Images: <img src="/uploads/..." />                   │   │
│  │ For Videos: <video><source src="/uploads/..." /></video> │   │
│  │ For Audio:  <audio><source src="/uploads/..." /></audio> │   │
│  │ For PDFs:   <iframe src="/uploads/..." />                │   │
│  │                                                          │   │
│  │ [Close Preview]                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow - Create Module

```
TEACHER INPUT
    │
    ├─ Title: "Algebra 101"
    ├─ Description: "Learn basics"
    ├─ Type: "PDF"
    └─ Files: [lesson.pdf, examples.xlsx, video.mp4]
    │
    ▼
FORM DATA (multipart)
    │
    ├─ subject_id: 1
    ├─ title: "Algebra 101"
    ├─ content: "Learn basics"
    ├─ file_type: "PDF"
    └─ file: [binary content of 3 files]
    │
    ▼
API SERVICE (createModule)
    │
    ├─ Check FormData instance
    ├─ skipContentType: true
    └─ POST /api/v1/modules
    │
    ▼
MODULE CONTROLLER (create)
    │
    ├─ Validate subject_id, title
    ├─ Module.create() → insert into modules table
    │
    ├─ FOR EACH FILE:
    │   │
    │   ├─ Get filename and path
    │   ├─ Extract file extension
    │   ├─ Call Module.addModuleFile()
    │   └─ INSERT into module_files table
    │
    ├─ Check auto-sync setting
    ├─ Mark module as synced if enabled
    │
    └─ Return module with files array
    │
    ▼
DATABASE
    │
    ├─ INSERT modules (1 row)
    └─ INSERT module_files (3 rows)
    │
    ▼
FILE SYSTEM
    │
    └─ /uploads/module-{timestamp}-{filename} (3 files)
```

## Data Flow - Student Views Module

```
STUDENT REQUEST
    │
    ├─ GET /api/v1/modules/:id
    │
    ▼
MODULE CONTROLLER (getById)
    │
    ├─ Query modules table
    ├─ Call Module.getModuleFiles(id)
    │
    ▼
DATABASE
    │
    ├─ SELECT * FROM modules WHERE id = ?
    ├─ SELECT * FROM module_files WHERE module_id = ? AND is_active = TRUE
    │
    ▼
API RESPONSE
    │
    ├─ {
    │   "id": 1,
    │   "title": "Algebra 101",
    │   "content": "Learn basics",
    │   "files": [
    │     {
    │       "id": 1,
    │       "file_name": "module-123-lesson.pdf",
    │       "file_path": "/uploads/module-123-lesson.pdf",
    │       "original_name": "lesson.pdf",
    │       "file_type": "pdf"
    │     },
    │     ... (more files)
    │   ]
    │ }
    │
    ▼
STUDENT BROWSER
    │
    ├─ Render module details
    ├─ Display file list
    │   ├─ lesson.pdf → [Preview] [Download]
    │   ├─ examples.xlsx → [Preview] [Download]
    │   └─ video.mp4 → [Preview] [Download]
    │
    ▼
STUDENT CLICKS [Preview]
    │
    ├─ JavaScript previewFile() called
    │ │
    │ ├─ Check file extension
    │ │
    │ ├─ IF PDF:
    │ │   └─ <iframe src="/uploads/..." />
    │ │
    │ ├─ ELSE IF IMAGE:
    │ │   └─ <img src="/uploads/..." />
    │ │
    │ ├─ ELSE IF VIDEO:
    │ │   └─ <video><source src="/uploads/..." /></video>
    │ │
    │ ├─ ELSE IF AUDIO:
    │ │   └─ <audio><source src="/uploads/..." /></audio>
    │ │
    │ └─ ELSE:
    │     └─ Show [Download] button
    │
    └─ Open file preview modal
```

## Component Relationships

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  TEACHER INTERFACE (view-subject.html)                      │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Module Modal                                         │   │
│  │ ├─ Title Input                                      │   │
│  │ ├─ Description Input                                │   │
│  │ ├─ File Type Select                                 │   │
│  │ └─ File Upload Area                                 │   │
│  │    └─ displayModuleFiles() → File List             │   │
│  │       └─ removeModuleFile() → Delete from array    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  JavaScript Functions:                                       │
│  - openModuleModal()                                         │
│  - loadModuleForEdit()                                       │
│  - displayModuleFiles()                                      │
│  - removeModuleFile()                                        │
│  - saveModule()                                              │
│                                                              │
│  Calls ApiService:                                           │
│  - apiService.createModule(FormData)                         │
│  - apiService.updateModule(id, FormData)                     │
│  - apiService.deleteModuleFile(fileId)                       │
│                                                              │
└──────────────────────────────────────────────────────────────┘
        │
        │ Makes API calls to
        │
        ▼
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  BACKEND (Node.js + Express)                                │
│                                                              │
│  Routes (modules.js)                                         │
│  ├─ POST / → upload.single('file')                          │
│  ├─ PUT /:id → upload.single('file')                        │
│  └─ DELETE /file/:fileId                                    │
│                                                              │
│  Controllers (moduleController.js)                           │
│  ├─ create() → handle file upload                           │
│  ├─ update() → handle file update                           │
│  └─ deleteFile() → remove file                              │
│                                                              │
│  Models (Module.js)                                          │
│  ├─ getAll() → fetch with files                             │
│  ├─ getById() → fetch with files                            │
│  ├─ create() → insert module                                │
│  ├─ getModuleFiles() → fetch all files                      │
│  ├─ addModuleFile() → insert file record                    │
│  └─ deleteModuleFile() → soft delete                        │
│                                                              │
│  Storage                                                      │
│  └─ /uploads/ → Physical files                              │
│                                                              │
└──────────────────────────────────────────────────────────────┘
        │
        │ Reads/writes to
        │
        ▼
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  DATABASE (MySQL)                                            │
│                                                              │
│  modules table                                               │
│  ├─ id, subject_id, title, content                          │
│  ├─ file_type, is_synced, created_at                        │
│  └─ ←─┐                                                      │
│       │                                                       │
│  module_files table                                          │
│  ├─ id, module_id (FK), file_name, file_path                │
│  ├─ file_type, file_size, original_name                     │
│  ├─ is_active, created_at                                   │
│  └─ ──┘                                                      │
│                                                              │
└──────────────────────────────────────────────────────────────┘
        │
        │ Serves files to
        │
        ▼
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  STUDENT INTERFACE (studentViewModules.html)                │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Module View Modal                                    │   │
│  │ ├─ Title & Description                              │   │
│  │ └─ Files List                                        │   │
│  │    └─ displayModuleFilesInModal()                   │   │
│  │       └─ previewFile() on click                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ File Preview Modal                                   │   │
│  │ ├─ Images: <img>                                     │   │
│  │ ├─ Videos: <video controls>                          │   │
│  │ ├─ Audio: <audio controls>                           │   │
│  │ ├─ PDFs: <iframe>                                    │   │
│  │ └─ Others: [Download]                               │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  JavaScript Functions:                                       │
│  - openModuleViewModal()                                     │
│  - displayModuleFilesInModal()                               │
│  - previewFile()                                             │
│  - closeFilePreviewModal()                                   │
│                                                              │
│  Accesses: /uploads/ files directly                          │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## File Processing Pipeline

```
┌─────────────────────────────────────┐
│   Student Selects Multiple Files    │
│   file1.pdf, file2.mp4, file3.jpg   │
└────────────────┬────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│  Browser FormData.append()          │
│  For each file add to FormData       │
└────────────────┬────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│  ApiService.createModule(FormData)  │
│  POST with multipart/form-data      │
└────────────────┬────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│  Multer Middleware                  │
│  - Validate file type               │
│  - Check file size < 100MB          │
│  - Save to /uploads/ directory      │
└────────────────┬────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│  Module Controller                  │
│  - Create module record             │
│  - For each file:                   │
│    - Module.addModuleFile()         │
│    - Insert into module_files       │
└────────────────┬────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│  Database                           │
│  - 1 row in modules                 │
│  - 3 rows in module_files           │
└────────────────┬────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│  Return Response                    │
│  - Module with files array          │
│  - Show success message             │
└─────────────────────────────────────┘
```

## Security Architecture

```
┌─────────────────────────────────────┐
│  FILE UPLOAD VALIDATION             │
├─────────────────────────────────────┤
│ 1. Whitelist extensions             │
│    ✓ pdf, doc, docx, ppt, pptx     │
│    ✓ mp4, webm, jpg, png, etc      │
│    ✗ exe, bat, script files        │
│                                     │
│ 2. Size limit: 100MB max            │
│    ✗ Files > 100MB rejected         │
│                                     │
│ 3. Type checking                    │
│    ✓ Verify MIME type               │
│                                     │
│ 4. Storage security                 │
│    ✓ Outside webroot (safer)        │
│    ✓ Timestamped filenames          │
│    ✓ No direct execute permissions  │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  API AUTHORIZATION                  │
├─────────────────────────────────────┤
│ Create Module:                      │
│   ✓ Requires authentication         │
│   ✓ Teacher role only               │
│                                     │
│ Delete File:                        │
│   ✓ Requires authentication         │
│   ✓ Only owner can delete           │
│   ✓ Verify file belongs to module   │
│                                     │
│ Get Module (Student):               │
│   ✓ Optional auth                   │
│   ✓ Return only synced modules      │
└─────────────────────────────────────┘
```

This architecture ensures safe, scalable, and user-friendly file management for the LET PWA system.
