# Google Drive Upload - Quick Start Guide

## What Gets Uploaded?

When you upload a video segment, **two files** are automatically uploaded to Google Drive:

1. ✅ **Video file** (`segment_N_uuid.mp4`) - Your final video with title overlay
2. ✅ **Summary file** (`segment_N_uuid_summary.txt`) - The AI-generated summary

Both files are uploaded together and can be accessed from Google Drive.

## Step-by-Step Usage

### Step 1: Setup (One-time)

1. **Get Google Drive Credentials** (see main README.md for details)
2. **Add to `.env` file:**
   ```env
   GOOGLE_DRIVE_CLIENT_ID=your_client_id
   GOOGLE_DRIVE_CLIENT_SECRET=your_client_secret
   GOOGLE_DRIVE_REFRESH_TOKEN=your_refresh_token
   ```
3. **Restart backend server**

### Step 2: Process Your Video

1. Upload a video file
2. Click "Split Video"
3. Wait for processing to complete

### Step 3: Upload to Google Drive

#### Option A: Upload Individual Segments

1. Scroll to the "Google Drive Upload" section
2. Click **"Upload to Drive"** next to any segment
3. The video + summary.txt will be uploaded automatically
4. Click **"View on Google Drive"** to see your files

#### Option B: Upload All Segments at Once

1. In the "Google Drive Upload" section
2. Click **"Upload All Segments"**
3. All segments (with their summaries) will be uploaded
4. You'll see a success message with total file count

## What You'll See in Google Drive

After uploading, you'll find:
- `segment_1_uuid.mp4` - Your video
- `segment_1_uuid_summary.txt` - Summary text file
- `segment_2_uuid.mp4` - Next video
- `segment_2_uuid_summary.txt` - Its summary
- ... and so on

## Troubleshooting

**"Google Drive is not configured"**
→ Add credentials to `.env` and restart backend

**"Connect to Google Drive" button**
→ Click it to authenticate (one-time setup)

**Files uploaded but no summary?**
→ Check that summaries were generated during processing

## Need More Help?

See the full guide: [docs/GOOGLE_DRIVE_USAGE.md](docs/GOOGLE_DRIVE_USAGE.md)
