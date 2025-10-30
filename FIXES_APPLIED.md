# Fixes Applied

## Issue 1: DocumentFile is undefined
**Error:** `TypeError: Cannot read property 'fromTreeUri' of undefined`

**Root Cause:** `DocumentFile` is not exported by react-native-saf-x v2.2.3. The correct API is `createFile(uri, options)`.

**Fix:**
- Changed import from `DocumentFile` to `createFile`
- Updated both `saveFromUrl()` and `saveFile()` to use:
  ```typescript
  const childUri = `${downloadsPath}/document/${encodeURIComponent(filename)}`;
  const doc = await createFile(childUri, { mimeType });
  ```

## Issue 2: Progress Bar Broken
**Problem:** Progress could be overwritten after download completion, causing the bar to not show 100%.

**Root Cause:** Race condition where `UPDATE_PROGRESS` actions could arrive after `COMPLETE_DOWNLOAD`, overwriting the completed state.

**Fix:** Modified the `UPDATE_PROGRESS` reducer in `useDownloads.tsx` to ignore updates for downloads that are already in a terminal state (completed, failed, or cancelled).

## Files Modified
1. `src/services/downloadService.ts` - Fixed SAF file creation API
2. `src/hooks/useDownloads.tsx` - Fixed progress bar race condition

## Testing Checklist
- [ ] Download a file with SAF folder selected
- [ ] Verify no file picker dialog appears
- [ ] Verify file is saved to the selected folder
- [ ] Verify progress bar reaches 100% and stays there
- [ ] Verify no "DocumentFile is undefined" errors in console
