# Module File Upload Feature - Implementation Guide

## Overview
This document describes the fixes and implementations for the module creation and file upload feature.

## Issues Fixed

### 1. **File Upload Not Working**
   - **Problem**: Teachers could upload files but they weren't saved or accessible
   - **Solution**: Updated the module controller to handle file uploads via multer middleware

### 2. **No File Storage for Multiple Files**
   - **Problem**: Module schema only had one `file_url` field, couldn't store multiple files
   - **Solution**: Created new `module_files` table to store multiple files per module

### 3. **Students Can't See Uploaded Files**
   - **Problem**: Module API didn't return file information to students
   - **Solution**: Updated Module model to include files array in responses

### 4. **File Preview Opens in New Tab**
   - **Problem**: Links to files would open in new tabs/download instead of previewing
   - **Solution**: Created file preview modal with embedded viewers for:
     - Images (jpg, png, gif, webp)
     - Videos (mp4, webm)
     - Audio (mp3, wav, ogg)
     - PDFs (using iframe)
     - Documents (with download option)

### 5. **Teacher Can't Remove Files During Edit**
   - **Problem**: No way to delete files from a module
   - **Solution**: Added file removal functionality with API endpoint

## Database Changes

### New Table: `module_files`
```sql
CREATE TABLE `module_files` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `module_id` INT NOT NULL,
  `file_name` VARCHAR(255) NOT NULL,
  `file_path` VARCHAR(500) NOT NULL,
  `file_type` VARCHAR(50),
  `file_size` INT,
  `original_name` VARCHAR(255),
  `uploaded_by` INT NOT NULL,
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`module_id`) REFERENCES `modules` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`uploaded_by`) REFERENCES `teachers` (`id`),
  INDEX `idx_module_id` (`module_id`),
  INDEX `idx_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## Backend Changes

### 1. **Module Controller** (`backend/src/controllers/moduleController.js`)
- Updated `create()` to handle file uploads
- Updated `update()` to handle new file uploads during editing
- Added `deleteFile()` function to remove files from modules

### 2. **Module Model** (`backend/src/models/Module.js`)
- Added `getModuleFiles(moduleId)` - retrieves all active files for a module
- Added `addModuleFile(moduleId, fileData)` - stores file metadata
- Added `deleteModuleFile(fileId)` - soft-deletes a file
- Updated `getAll()` and `getById()` to include files array

### 3. **Module Routes** (`backend/src/routes/modules.js`)
- Added file deletion route: `DELETE /modules/file/:fileId`
- Already supported file upload via multer middleware

### 4. **API Service** (`assets/scripts/ApiService.js`)
- Added `deleteModuleFile(fileId)` method

## Frontend Changes

### Teacher Side (`teacher/view-subject.html`)

#### Module Modal Updates
- Changed file input to `multiple` to allow selecting multiple files at once
- Added file list display showing all uploaded/selected files
- Each file has a remove button to delete it
- Clean UI showing file names and types

#### JavaScript Functions Updated
- `openModuleModal()` - loads existing files for editing
- `loadModuleForEdit()` - fetches module with its files
- `displayModuleFiles()` - shows list of selected/uploaded files
- `removeModuleFile(index)` - removes file from list or deletes from database
- `saveModule()` - handles FormData with multiple files

### Student Side (`student/studentViewModules.html`)

#### New Modal Components
- **Module View Modal**: Shows module details + file list
- **File Preview Modal**: Full-screen preview of files

#### File Display Features
- Lists all module files with icons based on file type
- Click on file to preview (doesn't open in new tab)
- Download button for each file
- File type badges (PDF, MP4, JPG, etc.)

#### Preview Capabilities
- **Images**: Displayed inline with proper scaling
- **Videos**: HTML5 video player with controls
- **Audio**: HTML5 audio player with controls
- **PDFs**: Embedded viewer via iframe
- **Documents**: Download option shown

## Supported File Types

### Allowed Extensions
- Documents: .pdf, .doc, .docx, .txt
- Presentations: .ppt, .pptx
- Videos: .mp4, .webm, .avi, .mov
- Images: .jpg, .jpeg, .png, .gif, .webp
- Audio: .mp3, .wav, .ogg

### File Size
- Maximum: 100MB per file
- Configurable via `MAX_FILE_SIZE` environment variable

## API Endpoints

### Create Module (with files)
```
POST /api/v1/modules
Content-Type: multipart/form-data

Form Data:
- subject_id: 1
- title: "Module Name"
- content: "Description"
- file_type: "PDF"
- file: <file> (multiple files supported)
```

### Update Module (with new files)
```
PUT /api/v1/modules/:id
Content-Type: multipart/form-data

Form Data:
- title: "Updated Title"
- content: "Updated Description"
- file: <file> (optional, multiple files supported)
```

### Delete Module File
```
DELETE /api/v1/modules/file/:fileId
Authorization: Bearer <token>
```

### Get Module with Files
```
GET /api/v1/modules/:id

Response:
{
  "id": 1,
  "title": "Module 1",
  "content": "Description",
  "file_type": "PDF",
  "files": [
    {
      "id": 1,
      "file_name": "module-123-myfile.pdf",
      "file_path": "/uploads/module-123-myfile.pdf",
      "file_type": "pdf",
      "original_name": "myfile.pdf",
      "created_at": "2024-01-01T12:00:00Z"
    }
  ]
}
```

## User Workflows

### Teacher - Creating Module with Files

1. Click "Add Module"
2. Enter title and description
3. Select module type from dropdown
4. Click file upload area or drag & drop files
5. See list of selected files (can remove any)
6. Click "Save Module"
7. Files are uploaded and linked to the module

### Teacher - Editing Module

1. Click edit button on module card
2. Module details and existing files load
3. Can add new files by selecting them
4. Can remove existing files with trash button
5. Click "Save Module"
6. Changes are applied

### Student - Viewing Module

1. Click "View Module" on a module card
2. Modal opens showing:
   - Module title and description
   - File type and creation date
   - List of all available files
3. Click on file to preview it (stays in modal)
4. Or click "Download" to download file
5. For unsupported types, shows download option

### Student - Previewing File

1. Click on any file in the module file list
2. Full-screen preview modal opens
3. For images/videos/audio: plays inline
4. For PDFs: embedded viewer with scrolling
5. For unsupported types: shows download button
6. Click X or outside to close

## Testing Checklist

- [ ] Teacher can upload single file to new module
- [ ] Teacher can upload multiple files to new module
- [ ] Teacher can remove files from module during creation
- [ ] Teacher can edit module and add more files
- [ ] Teacher can delete individual files from existing module
- [ ] Student can see all module files in view modal
- [ ] Student can click files to preview (stays in-app)
- [ ] Student can download files
- [ ] Images display correctly in preview
- [ ] Videos play with controls in preview
- [ ] Audio plays with controls in preview
- [ ] PDFs are embedded and scrollable
- [ ] File preview doesn't open in new tab
- [ ] Module with 5 files shows all 5 files to student
- [ ] Module with 3 files (2 videos, 1 PDF) all display correctly

## Database Migration

To apply the schema changes:

1. Run the updated schema.sql to create the module_files table
2. Optionally, migrate existing modules (they'll have no files)
3. New modules created will properly use the file system

```sql
-- Run schema.sql which includes the new module_files table
mysql -u root -p pwa_let_db < backend/database/schema.sql
```

## Notes

- Files are stored in `/uploads/` directory
- File paths are relative: `/uploads/module-{timestamp}-{filename}`
- Only teachers who created a module can delete its files
- Students see only synced modules and their files
- Files are soft-deleted (is_active flag) to maintain referential integrity
