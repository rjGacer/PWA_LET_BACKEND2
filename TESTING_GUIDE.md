# Module Upload Feature - Testing Guide

## Pre-Testing Checklist

Before running tests, ensure:
- [ ] Database backup taken
- [ ] schema.sql applied to database
- [ ] Backend server restarted
- [ ] Browser cache cleared
- [ ] Test files prepared (see below)
- [ ] Teacher and student accounts available

---

## Test Files Preparation

Create these test files:
```
test-lesson.pdf       (text: "Sample PDF lesson")
test-video.mp4        (video file, 10MB or less)
test-image.jpg        (image file)
test-audio.mp3        (audio file)
test-document.docx    (Word document)
test-data.xlsx        (Excel spreadsheet)
large-file.pdf        (>100MB for rejection test)
```

Or use existing files if available.

---

## Test Suite 1: Teacher Module Creation

### Test 1.1: Create Module with Single File
**Steps**:
1. Login as teacher
2. Navigate to "Subjects" → "Modules"
3. Click "Add Module"
4. Fill:
   - Title: "Test Module 1"
   - Description: "Single file test"
   - Type: "PDF"
5. Click upload area
6. Select: test-lesson.pdf
7. Verify: File appears in list
8. Click "Save Module"

**Expected Result**: ✅
- Module created in database
- File saved to /uploads/
- File record created in module_files table
- Success message shown

**Validation**:
```sql
SELECT * FROM modules WHERE title = "Test Module 1";
SELECT * FROM module_files WHERE module_id = [id];
```

---

### Test 1.2: Create Module with Multiple Files
**Steps**:
1. Click "Add Module"
2. Fill:
   - Title: "Test Module 2"
   - Description: "Multiple files test"
   - Type: "PDF"
3. Click upload area
4. Select ALL: test-lesson.pdf, test-video.mp4, test-image.jpg
5. Verify: All 3 files appear in list
6. Click "Save Module"

**Expected Result**: ✅
- Module created with 3 files
- All files uploaded to /uploads/
- All file records created in module_files
- File list shows all 3 files with proper icons

**Validation**:
```sql
SELECT COUNT(*) FROM module_files WHERE module_id = [id];
-- Should return: 3
```

---

### Test 1.3: Create Module with Mixed File Types
**Steps**:
1. Click "Add Module"
2. Fill:
   - Title: "Test Module 3"
   - Description: "Mixed file types"
   - Type: "Mixed"
3. Select: test-video.mp4, test-document.docx, test-image.jpg, test-audio.mp3, test-data.xlsx
4. Verify: All 5 files appear with correct icons
5. Click "Save Module"

**Expected Result**: ✅
- 5 files uploaded
- Icons shown correctly (video, doc, image, audio, spreadsheet)
- No errors during save
- All files in database

---

### Test 1.4: Remove File Before Saving
**Steps**:
1. Click "Add Module"
2. Fill Title and Description
3. Select: test-lesson.pdf, test-video.mp4, test-image.jpg
4. Verify: 3 files listed
5. Click trash icon on test-video.mp4
6. Verify: List shows only 2 files (lesson.pdf, image.jpg)
7. Click "Save Module"

**Expected Result**: ✅
- Only 2 files uploaded (video was removed)
- Only 2 file records in database
- Confirm no video file in /uploads/

---

### Test 1.5: Try Upload File > 100MB
**Steps**:
1. Click "Add Module"
2. Click upload area
3. Try to select large-file.pdf (>100MB)
4. Observe upload behavior

**Expected Result**: ✅
- Error message shown: "File is too large"
- File rejected before upload
- Upload attempt doesn't complete

---

### Test 1.6: Try Upload Unsupported File Type
**Steps**:
1. Click "Add Module"
2. Click upload area
3. Try to select .exe or .bat file

**Expected Result**: ✅
- File rejected
- Error message shown
- File doesn't appear in list

---

## Test Suite 2: Teacher Module Editing

### Test 2.1: Edit Module and Add Files
**Steps**:
1. Find "Test Module 1" (from Test 1.1)
2. Click Edit button
3. Verify: Current file (test-lesson.pdf) shown in list
4. Click upload area
5. Select: test-image.jpg
6. Verify: Now 2 files in list (lesson.pdf, image.jpg)
7. Click "Save Module"

**Expected Result**: ✅
- Module updated
- New file added to existing files
- Both files visible in database
- No existing files removed

**Validation**:
```sql
SELECT COUNT(*) FROM module_files 
WHERE module_id = [id] AND is_active = TRUE;
-- Should return: 2
```

---

### Test 2.2: Edit Module and Remove Existing File
**Steps**:
1. Find "Test Module 2" (from Test 1.2, has 3 files)
2. Click Edit button
3. Verify: 3 files shown
4. Click trash on test-video.mp4
5. Verify: Confirmed deletion in dialog
6. List now shows 2 files
7. Click "Save Module"

**Expected Result**: ✅
- File marked as inactive in database (is_active = FALSE)
- File still exists in /uploads/ (soft delete)
- Only 2 files show in student view
- No errors

**Validation**:
```sql
SELECT * FROM module_files 
WHERE module_id = [id] AND file_name LIKE '%test-video%';
-- Should show: is_active = FALSE
```

---

### Test 2.3: Edit Module and Add + Remove Files
**Steps**:
1. Find "Test Module 3" (has 5 files)
2. Click Edit button
3. Verify: 5 files shown
4. Remove: test-document.docx, test-data.xlsx (2 files)
5. List shows 3 remaining
6. Upload: test-lesson.pdf, test-audio.mp3 (2 new)
7. List shows 5 files total
8. Click "Save Module"

**Expected Result**: ✅
- Original 3 files active
- Added 2 files active
- Removed 2 files inactive
- All operations tracked in database

---

## Test Suite 3: Student Module Viewing

### Test 3.1: View Module with Single File
**Steps**:
1. Login as student
2. Navigate to modules
3. Click "View" on "Test Module 1"
4. Module modal opens
5. Scroll to "Module Files" section
6. Verify: 1 file listed (test-lesson.pdf)

**Expected Result**: ✅
- File visible with icon
- "Preview" button shown
- "Download" button shown
- No errors

---

### Test 3.2: View Module with Multiple Files
**Steps**:
1. Click "View" on "Test Module 2"
2. Verify: 2 files shown in list
3. See different icons for each file type

**Expected Result**: ✅
- All files listed
- Correct icons shown
- Both buttons visible
- Proper file names displayed

---

### Test 3.3: View Module with 5+ Files
**Steps**:
1. Click "View" on "Test Module 3"
2. Verify: All 5 files shown
3. Scroll if necessary
4. No files missing

**Expected Result**: ✅
- All 5 files visible
- Can scroll file list
- No truncation
- Performance acceptable

---

## Test Suite 4: File Preview Functionality

### Test 4.1: Preview Image File
**Steps**:
1. Open module with image (test-image.jpg)
2. Click "Preview" on image
3. Observe modal

**Expected Result**: ✅
- Preview modal opens
- Image displayed at proper size (fits in modal)
- Close button visible
- No new tab/window opened
- Click outside modal to close

---

### Test 4.2: Preview Video File
**Steps**:
1. Open module with video (test-video.mp4)
2. Click "Preview" on video
3. Observe preview modal

**Expected Result**: ✅
- Video player opens in modal
- Play/pause controls visible
- Volume control visible
- Timeline shown
- Can seek through video
- No new tab opened
- Click X to close

---

### Test 4.3: Preview Audio File
**Steps**:
1. Open module with audio (test-audio.mp3)
2. Click "Preview" on audio
3. Observe preview modal

**Expected Result**: ✅
- Audio player visible
- Play/pause controls shown
- Timeline shown
- Can adjust volume
- Can seek through audio
- Stays in-app
- Click X to close

---

### Test 4.4: Preview PDF File
**Steps**:
1. Open module with PDF (test-lesson.pdf)
2. Click "Preview" on PDF
3. Observe preview modal

**Expected Result**: ✅
- PDF viewer opens
- Document rendered
- Can scroll through pages
- Can zoom if available
- Stays in-app
- Click X to close

---

### Test 4.5: Preview Unsupported File Type
**Steps**:
1. Open module with unsupported file (test-document.docx)
2. Click "Preview" on file
3. Observe modal

**Expected Result**: ✅
- Modal shows message (or download dialog)
- "Download" button visible
- Option to download file
- No errors

---

## Test Suite 5: File Download Functionality

### Test 5.1: Download Single File
**Steps**:
1. Open module with file
2. Click "Download" on test-lesson.pdf
3. Observe browser behavior

**Expected Result**: ✅
- File downloads to downloads folder
- File name correct
- File size matches original
- File integrity valid (can open)

---

### Test 5.2: Download Multiple Files
**Steps**:
1. Open module with 3+ files
2. Click "Download" on each file
3. Let downloads complete

**Expected Result**: ✅
- Each file downloads
- All files in downloads folder
- File names unique
- No conflicts or overwrites

---

### Test 5.3: Download Large File
**Steps**:
1. Open module with large file (10-50MB)
2. Click "Download"
3. Monitor download progress

**Expected Result**: ✅
- Download begins
- Progress indication shown
- Download completes
- File accessible

---

## Test Suite 6: Data Integrity Tests

### Test 6.1: Database Consistency
**Steps**:
1. Create module with 3 files
2. Check database state
3. Edit module (remove 1, add 2)
4. Check database state

**Expected Result**: ✅
```sql
-- After creation
SELECT COUNT(*) FROM module_files WHERE module_id = X;
-- Result: 3, all is_active = TRUE

-- After edit
SELECT COUNT(*) FROM module_files 
WHERE module_id = X AND is_active = TRUE;
-- Result: 4

SELECT COUNT(*) FROM module_files 
WHERE module_id = X AND is_active = FALSE;
-- Result: 1
```

---

### Test 6.2: File System Integrity
**Steps**:
1. Create module with files
2. Check /uploads/ directory
3. Edit module (remove file)
4. Verify file still exists in /uploads/

**Expected Result**: ✅
- Files stored in /uploads/ directory
- Filenames match pattern: module-{timestamp}-{name}
- Files readable
- File size correct
- Soft-deleted files still present

---

### Test 6.3: Authorization Check
**Steps**:
1. Teacher A creates module with files
2. Teacher B tries to edit module
3. Teacher B tries to delete file

**Expected Result**: ✅
- Teacher B can see module (if synced)
- Teacher B cannot edit (permission denied)
- Teacher B cannot delete file (permission denied)
- Proper error message shown

---

## Test Suite 7: Edge Cases

### Test 7.1: Empty Upload Area Click
**Steps**:
1. Click "Add Module"
2. Click upload area
3. Cancel file selection (don't select file)
4. Try to save

**Expected Result**: ✅
- Module created without files
- No error
- File list empty for student
- Can add files later

---

### Test 7.2: Rapid File Removals
**Steps**:
1. Create module with 5 files
2. Edit module
3. Rapidly click remove on multiple files
4. Click "Save"

**Expected Result**: ✅
- All removals applied
- Correct files marked inactive
- No data loss

---

### Test 7.3: Browser Back Button
**Steps**:
1. Create module with files
2. Navigate away
3. Click back button
4. View module

**Expected Result**: ✅
- Files still present
- No data loss
- Module fully functional

---

### Test 7.4: Simultaneous Edits (2 Teachers)
**Steps**:
1. Teacher A opens module for edit
2. Teacher B opens same module for edit
3. Both add different files
4. Both click "Save"

**Expected Result**: ✅
- Last save wins (or merge applies)
- No data corruption
- All files present or error shown
- Consistent state maintained

---

## Test Suite 8: Browser Compatibility

Test on:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Chrome (Android)
- [ ] Mobile Safari (iOS)

For each browser:
- [ ] File upload works
- [ ] Preview modal renders
- [ ] Video plays with controls
- [ ] PDF scrolls
- [ ] Download works
- [ ] No console errors

---

## Test Suite 9: Performance Tests

### Test 9.1: Upload Speed
**Steps**:
1. Create module with 5 files (50MB total)
2. Measure time to upload and save

**Expected Result**: ✅
- Upload completes in < 30 seconds (on 10Mbps connection)
- No timeout errors
- All files saved

---

### Test 9.2: Preview Load Speed
**Steps**:
1. Open modal with file
2. Click preview
3. Measure time to render

**Expected Result**: ✅
- Images load in < 1 second
- Videos load in < 2 seconds
- PDFs load in < 3 seconds

---

### Test 9.3: List Rendering
**Steps**:
1. Create module with 10+ files
2. Open module view
3. Observe render performance

**Expected Result**: ✅
- List renders smoothly
- No lag
- All items visible or scrollable

---

## Test Results Template

```
TEST SUITE: ___________________
Tester: ___________________
Date: ___________________
Browser: ___________________
OS: ___________________

Test Case | Status | Notes
-----------|--------|-------
1.1 |  ☐ PASS ☐ FAIL | _________
1.2 |  ☐ PASS ☐ FAIL | _________
1.3 |  ☐ PASS ☐ FAIL | _________
...

Overall: ☐ PASS ☐ FAIL
Issues Found: _________
```

---

## Success Criteria

✅ All tests pass
✅ No console errors
✅ No broken functionality
✅ Performance acceptable
✅ Data integrity maintained
✅ All browsers compatible
✅ Ready for production

---

## Rollback Plan

If tests fail critically:
1. Stop backend server
2. Restore database from backup
3. Revert code changes
4. Restart server
5. Verify rollback complete

---

## Documentation

- [MODULE_UPLOAD_QUICK_GUIDE.md](MODULE_UPLOAD_QUICK_GUIDE.md) - User guide
- [MODULE_UPLOAD_FIX.md](MODULE_UPLOAD_FIX.md) - Technical details
- [IMPLEMENTATION_COMPLETE.md](IMPLEMENTATION_COMPLETE.md) - Feature summary
