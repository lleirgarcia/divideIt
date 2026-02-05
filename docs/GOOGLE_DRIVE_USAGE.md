# Google Drive Integration - Usage Guide

This guide explains how to use the Google Drive integration to upload your processed video segments and their associated files (summary.txt, transcription.txt) to Google Drive.

## Quick Start

### 1. Setup Google Drive Credentials

Follow the setup instructions in the main [README.md](../README.md#google-drive-setup-optional) to:
- Create a Google Cloud Project
- Enable Google Drive API
- Create OAuth 2.0 credentials
- Get your refresh token

### 2. Configure Environment Variables

Add these to your backend `.env` file:

```env
GOOGLE_DRIVE_CLIENT_ID=your_client_id_here
GOOGLE_DRIVE_CLIENT_SECRET=your_client_secret_here
GOOGLE_DRIVE_REDIRECT_URI=http://localhost:3051/api/google-drive/oauth/callback
GOOGLE_DRIVE_REFRESH_TOKEN=your_refresh_token_here
```

### 3. Restart Backend Server

Restart your backend server to load the new credentials.

## Using the Feature

### From the Web Interface

1. **Process a Video**: Upload and split a video as usual
2. **Authenticate**: If not already authenticated, click "Authenticate" in the Google Drive section
3. **Upload Segments**: 
   - Click "Upload to Drive" on individual segments, OR
   - Click "Upload All Segments" to upload everything at once

### What Gets Uploaded

When you upload a segment, the following files are automatically uploaded:

- ✅ **Video file** (`segment_N_uuid.mp4`) - The final video with title overlay
- ✅ **Summary file** (`segment_N_uuid_summary.txt`) - The AI-generated summary
- ⚠️ **Transcription file** (`segment_N_uuid.txt`) - Only if explicitly requested

All files are uploaded to the same location in Google Drive and are automatically shared publicly (if you choose that option).

### Upload Options

#### Single Segment Upload
- Uploads the video file + summary.txt automatically
- Files are linked together in Google Drive
- You get a shareable link for the video

#### Upload All Segments
- Uploads all segments with their summary files in one operation
- Shows progress and total file count
- All files are organized in Google Drive

## API Usage

### Upload Segment with Summary

```bash
POST /api/google-drive/upload-segment
Content-Type: application/json

{
  "segmentPath": "segment_1_uuid.mp4",
  "includeSummary": true,
  "includeTranscription": false,
  "makePublic": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "video": {
      "upload": {
        "fileId": "1abc...",
        "webViewLink": "https://drive.google.com/file/d/...",
        "name": "segment_1_uuid.mp4",
        "mimeType": "video/mp4"
      },
      "share": {
        "shareableLink": "https://drive.google.com/file/d/...",
        "permissionId": "..."
      }
    },
    "summary": {
      "upload": {
        "fileId": "2def...",
        "webViewLink": "https://drive.google.com/file/d/...",
        "name": "segment_1_uuid_summary.txt",
        "mimeType": "text/plain"
      },
      "share": {
        "shareableLink": "https://drive.google.com/file/d/...",
        "permissionId": "..."
      }
    },
    "allUploads": [...],
    "allShares": [...]
  }
}
```

### Upload Multiple Segments

```bash
POST /api/google-drive/upload-multiple
Content-Type: application/json

{
  "filePaths": [
    "segment_1_uuid.mp4",
    "segment_2_uuid.mp4",
    "segment_3_uuid.mp4"
  ],
  "makePublic": true
}
```

**Note:** This endpoint uploads only the specified files. To upload videos with their summary files, use the `upload-segment` endpoint for each segment.

## File Organization

### Default Behavior
- Files are uploaded to the root of your Google Drive
- Each file maintains its original name
- Video and summary files are uploaded separately but can be found together

### Using Folders

You can organize uploads into folders:

```bash
# Create a folder first
POST /api/google-drive/create-folder
{
  "folderName": "My Video Segments - 2026-02-05"
}

# Then upload to that folder
POST /api/google-drive/upload-segment
{
  "segmentPath": "segment_1_uuid.mp4",
  "folderId": "folder_id_from_create_folder_response",
  "includeSummary": true
}
```

## Troubleshooting

### "Google Drive service not configured"
- Check that all environment variables are set in `.env`
- Restart the backend server after adding credentials

### "No refresh token available"
- Complete the OAuth flow to get a refresh token
- Visit `/api/google-drive/auth-url` to get the authorization URL
- Complete authentication and save the refresh token

### "File not found"
- Make sure the video has been processed and segments exist
- Check that the segment filename matches exactly
- Verify files exist in the `processed/` directory

### Files Uploaded but Summary Missing
- Check that summary files were generated during processing
- Verify the file exists: `segment_N_uuid_summary.txt`
- Check backend logs for any errors during summary generation

## Best Practices

1. **Organize by Date/Project**: Create folders for each project or date
2. **Use Descriptive Names**: Consider renaming files before upload for better organization
3. **Check Authentication**: Verify Google Drive status before bulk uploads
4. **Monitor Quota**: Google Drive has storage limits - monitor your usage
5. **Backup Important Files**: Keep local copies of important segments

## Security Notes

- Files uploaded with `makePublic: true` are accessible to anyone with the link
- Use `makePublic: false` for private uploads
- Refresh tokens should be kept secure - never commit them to version control
- Consider using environment-specific credentials for production

## Next Steps

After uploading to Google Drive, you can:
- Share links directly with others
- Download files from anywhere
- Organize files into folders
- Use Google Drive's collaboration features
- Access files from mobile devices

For more information, see the main [README.md](../README.md) and [API Reference](API_REFERENCE.md).
