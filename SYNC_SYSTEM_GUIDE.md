# Teacher Content Sync System - Implementation Guide

## Overview

The Teacher Content Sync System allows teachers to control which content (subjects, modules, quizzes) is visible to students. Content created by teachers is initially marked as "not synced" and won't be visible to students until the teacher explicitly syncs it.

## Features

### 1. **Auto-Sync Toggle**
- Teachers can enable/disable automatic syncing in Settings → Sync Settings
- When enabled: Content is automatically synced when the teacher goes online
- When disabled: Teachers must manually click "Sync Now" to share content with students

### 2. **Manual Sync**
- "Sync Now" button allows teachers to manually sync all pending content
- Shows real-time sync status and progress
- Displays number of items waiting to sync

### 3. **Sync Status Display**
- Shows pending items count
- Displays last sync time
- Visual indicator of sync status (Up to date / Pending)

### 4. **Student Visibility**
- Students automatically see only synced content
- No action needed from students - they just see the synced content when they're online
- If a teacher hasn't synced content yet, students won't see it

## Database Schema Changes

### New Tables

#### `teacher_sync_settings`
```sql
CREATE TABLE `teacher_sync_settings` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `teacher_id` INT NOT NULL UNIQUE,
  `auto_sync_enabled` BOOLEAN DEFAULT TRUE,
  `last_sync_time` TIMESTAMP NULL,
  `last_sync_status` ENUM('pending', 'in_progress', 'success', 'failed') DEFAULT 'pending',
  `last_sync_message` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`id`) ON DELETE CASCADE,
  INDEX `idx_teacher_id` (`teacher_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### New Columns Added to Existing Tables

Added to: `subjects`, `modules`, `quizzes`, `questions`

```sql
`is_synced` BOOLEAN DEFAULT FALSE,
`synced_at` TIMESTAMP NULL,
```

These columns track whether content has been synced to students.

## API Endpoints

### Sync Management Endpoints

#### Get Sync Settings
```
GET /api/v1/sync/settings
Authorization: Bearer {token}

Response:
{
  "auto_sync_enabled": true,
  "last_sync_time": "2026-05-22T10:30:00Z",
  "last_sync_status": "success",
  "last_sync_message": "Successfully synced all content",
  "pending_items": 3
}
```

#### Update Auto-Sync Setting
```
PUT /api/v1/sync/settings
Authorization: Bearer {token}
Content-Type: application/json

Request Body:
{
  "auto_sync_enabled": true
}

Response:
{
  "success": true,
  "message": "Auto-sync enabled",
  "auto_sync_enabled": true
}
```

#### Get Sync Status
```
GET /api/v1/sync/status
Authorization: Bearer {token}

Response:
{
  "unsynced_subjects": 2,
  "unsynced_modules": 5,
  "unsynced_quizzes": 1,
  "unsynced_questions": 0,
  "auto_sync_enabled": true,
  "last_sync_time": "2026-05-22T10:30:00Z",
  "needs_sync": true,
  "total_unsynced": 8
}
```

#### Trigger Manual Sync
```
POST /api/v1/sync/sync-now
Authorization: Bearer {token}

Response:
{
  "success": true,
  "message": "Content synced successfully",
  "synced_at": "2026-05-22T10:45:00Z",
  "synced_items": {
    "subjects": 2,
    "modules": 5,
    "quizzes": 1,
    "questions": 0
  }
}
```

## Content Visibility Logic

### Teacher View
- Teachers see **all their content** (synced and unsynced)
- Uses authenticated API endpoints with teacher token
- Content marked as unsynced has a visual indicator in the UI

### Student View
- Students see **only synced content**
- Uses unauthenticated API endpoints (or optional auth)
- Automatically filtered by `is_synced = TRUE` in database queries

## Frontend Components

### Teacher Settings Page (`teacher/settings.html`)

Features:
- Auto-sync toggle switch
- Pending items counter
- Last sync time display
- Sync status indicator
- "Sync Now" button with visual feedback
- Auto-refresh every 30 seconds when online
- Notification system for sync status

API Integration:
- Calls `ApiService.getSyncSettings()`
- Calls `ApiService.updateAutoSync()`
- Calls `ApiService.syncNow()`
- Calls `ApiService.getSyncStatus()`

## Backend Implementation

### Sync Controller (`backend/src/controllers/syncController.js`)

Key functions:
- `getSyncSettings()` - Retrieve teacher's sync preferences
- `updateAutoSync()` - Toggle auto-sync setting
- `getSyncStatus()` - Get count of unsynced items
- `syncNow()` - Trigger manual sync
- `syncTeacherContent()` - Helper to sync all unsynced content

### Content Filtering

Modified models to support sync filtering:
- `Subject.getAll(categoryId, onlySync)` - Filter subjects by sync status
- `Module.getAll(subjectId, onlySync)` - Filter modules by sync status
- `Quiz.getAll(subjectId, onlySync)` - Filter quizzes by sync status

Controller logic:
```javascript
// Filter by sync status if not authenticated (student view)
const onlySync = !req.user;
const subjects = await Subject.getAll(categoryId, onlySync);
```

## Authentication Middleware

New `optionalAuth` middleware allows:
- GET endpoints to work without authentication (for students)
- Automatically detect if user is authenticated
- Filter content based on sync status for unauthenticated users

## Workflow

### Teacher Creates Content
1. Teacher creates subject/module/quiz
2. Content is marked with `is_synced = FALSE`
3. Auto-sync is enabled (default) → auto-syncs when online
4. Auto-sync is disabled → teacher must manually click "Sync Now"

### Sync Process
1. Teacher goes online OR clicks "Sync Now"
2. System updates all unsynced content: `is_synced = TRUE`, `synced_at = NOW()`
3. Sync status updated in `teacher_sync_settings` table
4. Students can now see the content

### Student Views Content
1. Student loads modules/quizzes page (no authentication needed)
2. API returns only synced content: `is_synced = TRUE`
3. Student sees teacher's shared content
4. If student is offline, they still see cached content from before

## Installation & Setup

### 1. Update Database Schema
Run the migration SQL or execute schema.sql with the updated tables and columns.

### 2. Update API Service (Frontend)
The `ApiService.js` has been updated with new sync methods:
```javascript
api.getSyncSettings()
api.updateAutoSync(enabled)
api.getSyncStatus()
api.syncNow()
```

### 3. Server Routes
Ensure sync routes are imported in `server.js`:
```javascript
const syncRoutes = require('./routes/sync');
app.use(`${apiPrefix}/sync`, syncRoutes);
```

### 4. Test the Feature

**As a Teacher:**
1. Login to teacher dashboard
2. Go to Settings → Sync Settings
3. Create a new subject/module/quiz
4. Check that it appears in pending items count
5. Toggle auto-sync or click "Sync Now"
6. Verify sync completes successfully

**As a Student:**
1. Login to student dashboard
2. Go to Modules/Quizzes
3. Verify you only see synced content from teachers
4. Go offline and verify cached content still works

## Security Considerations

1. **Content Filtering**: All GET endpoints automatically filter by sync status for unauthenticated users
2. **Teacher Control**: Only teachers can trigger sync through authenticated endpoints
3. **Token Validation**: Optional auth middleware validates tokens but doesn't fail on missing auth
4. **Content Isolation**: Teachers' unsynced content is never exposed to students

## Error Handling

The system handles:
- Network errors during sync
- Database errors with rollback
- Invalid requests with proper error messages
- Missing required parameters
- Authorization failures

## Future Enhancements

1. Scheduled auto-sync at specific times
2. Selective sync (choose what to sync)
3. Sync history/audit log
4. Batch operations with progress tracking
5. Conflict resolution for modified content
6. Student access control (specific students vs all)
