'use client';

import { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { useVideoStore, VideoSegment } from '@/store/videoStore';
import {
  getGoogleDriveStatus,
  getGoogleDriveAuthUrl,
  uploadSegmentToGoogleDrive,
  GoogleDriveStatus
} from '@/services/api';
import toast from 'react-hot-toast';

/**
 * Component for uploading video segments to Google Drive
 * - Requires a folder name; always uploads all segments together to that folder.
 */
export function GoogleDriveUpload() {
  const { segments, videoId } = useVideoStore();
  const [status, setStatus] = useState<GoogleDriveStatus | null>(null);
  const [folderName, setFolderName] = useState('');
  const [uploadingAll, setUploadingAll] = useState(false);
  const [uploadedAll, setUploadedAll] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(null);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      const driveStatus = await getGoogleDriveStatus();
      setStatus(driveStatus);
    } catch (error: any) {
      console.error('Failed to check Google Drive status:', error);
      toast.error('Failed to check Google Drive status');
    }
  };

  const handleAuthenticate = async () => {
    try {
      const authUrl = await getGoogleDriveAuthUrl();
      // Open OAuth flow in new window
      window.open(authUrl, '_blank', 'width=600,height=700');
      toast.success('Please complete authentication in the popup window');
      
      // Check status after a delay
      setTimeout(() => {
        checkStatus();
      }, 3000);
    } catch (error: any) {
      console.error('Failed to get auth URL:', error);
      toast.error('Failed to start authentication');
    }
  };

  const handleUploadAll = async () => {
    const name = folderName.trim();
    if (!name) {
      toast.error('Enter a folder name for Google Drive');
      return;
    }
    if (uploadingAll || segments.length === 0) return;

    setUploadingAll(true);
    try {
      for (const segment of segments) {
        const filename = segment.downloadUrl.split('/').pop() || '';
        const result = await uploadSegmentToGoogleDrive(
          filename,
          videoId || undefined,
          undefined,
          true,
          true,
          false,
          name
        );
        setShareLink(result.video.upload.webViewLink);
      }

      setUploadedAll(true);
      const totalFiles = segments.length * 2; // video + summary per segment
      toast.success(
        `Uploaded ${segments.length} segments (${totalFiles} files) to folder "${name}" on Google Drive!`,
        { duration: 4000 }
      );
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || error.message || 'Upload failed');
    } finally {
      setUploadingAll(false);
    }
  };

  if (!status) {
    return (
      <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <p className="text-sm text-gray-600 dark:text-gray-400">Checking Google Drive status...</p>
      </div>
    );
  }

  if (!status.configured) {
    return (
      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
        <p className="text-sm text-yellow-800 dark:text-yellow-200">
          Google Drive is not configured. Please set up Google Drive credentials in the backend.
        </p>
      </div>
    );
  }

  if (!status.authenticated) {
    return (
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
              Connect to Google Drive
            </h3>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Authenticate with Google Drive to upload and share your video segments.
            </p>
          </div>
          <Button onClick={handleAuthenticate} size="sm">
            Authenticate
          </Button>
        </div>
      </div>
    );
  }

  if (segments.length === 0) {
    return (
      <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          No segments available. Upload and split a video first.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Input
        label="Folder name"
        value={folderName}
        onChange={(e) => setFolderName(e.target.value)}
        placeholder="Name of the folder in Google Drive"
        disabled={uploadingAll || uploadedAll}
        aria-label="Folder name for Google Drive"
      />
      <div className="flex flex-wrap items-center gap-3">
        <Button
          onClick={handleUploadAll}
          isLoading={uploadingAll}
          disabled={uploadingAll || !folderName.trim() || uploadedAll}
          className="w-full sm:w-auto"
        >
          {uploadedAll ? '✓ Uploaded' : 'Upload to Google Drive'}
        </Button>
        {uploadedAll && shareLink && (
          <a
            href={shareLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
          >
            View on Google Drive
          </a>
        )}
      </div>
    </div>
  );
}
