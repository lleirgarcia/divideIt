import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3051';

const apiClient = axios.create({
  baseURL: `${API_URL}/api`,
  // Don't set Content-Type for FormData - axios will set it automatically with boundary
});

export interface SplitVideoResponse {
  success: boolean;
  data: {
    videoId: string;
    originalVideo: {
      filename: string;
      duration: number;
      metadata: {
        duration: number;
        width: number;
        height: number;
        format: string;
        size: number;
      };
    };
    segments: Array<{
      segmentNumber: number;
      startTime: number;
      endTime: number;
      duration: number;
      downloadUrl: string;
    }>;
    totalSegments: number;
  };
}

/**
 * Splits a video into random segments
 * 
 * Uploads a video file and requests the backend to split it into segments.
 * Returns the response with original video info and generated segments.
 * 
 * @param {FormData} formData - FormData containing video file and split parameters
 * @returns {Promise<SplitVideoResponse>} Promise resolving to split response
 * @throws {Error} If request fails or video processing fails
 * 
 * @example
 * const formData = new FormData();
 * formData.append('video', file);
 * formData.append('segmentCount', '5');
 * const response = await splitVideo(formData);
 */
export const splitVideo = async (formData: FormData): Promise<SplitVideoResponse> => {
  const response = await apiClient.post<SplitVideoResponse>('/videos/split', formData);
  return response.data;
};

/**
 * Downloads a video segment file
 * 
 * Fetches a segment file from the backend and returns it as a Blob.
 * The blob can be used to create a download link or display the video.
 * 
 * @param {string} downloadUrl - URL path to the segment (e.g., '/api/videos/download/segment_1.mp4')
 * @returns {Promise<Blob>} Promise resolving to video file blob
 * @throws {Error} If download fails
 * 
 * @example
 * const blob = await downloadSegment('/api/videos/download/segment_1.mp4');
 * const url = URL.createObjectURL(blob);
 */
export const downloadSegment = async (downloadUrl: string): Promise<Blob> => {
  const response = await axios.get(`${API_URL}${downloadUrl}`, {
    responseType: 'blob',
  });
  return response.data;
};

/**
 * Get segment summary (written content) text
 */
export const getSegmentSummary = async (
  videoId: string,
  filename: string
): Promise<{ summary: string }> => {
  const response = await apiClient.get<{ success: boolean; data: { summary: string } }>(
    '/videos/segment-summary',
    { params: { videoId, filename } }
  );
  return response.data.data;
};

// Google Drive API interfaces
export interface GoogleDriveStatus {
  initialized: boolean;
  configured: boolean;
  authenticated: boolean;
}

export interface GoogleDriveUploadResult {
  fileId: string;
  webViewLink: string;
  webContentLink: string;
  name: string;
  mimeType: string;
  size: string;
}

export interface GoogleDriveShareResult {
  fileId: string;
  shareableLink: string;
  permissionId: string;
}

/**
 * Get Google Drive service status
 */
export const getGoogleDriveStatus = async (): Promise<GoogleDriveStatus> => {
  const response = await apiClient.get<{ success: boolean; data: GoogleDriveStatus }>('/google-drive/status');
  return response.data.data;
};

/**
 * Get Google Drive OAuth2 authorization URL
 */
export const getGoogleDriveAuthUrl = async (): Promise<string> => {
  const response = await apiClient.get<{ success: boolean; data: { authUrl: string } }>('/google-drive/auth-url');
  return response.data.data.authUrl;
};

/**
 * Upload a file to Google Drive
 */
export const uploadToGoogleDrive = async (
  filePath: string,
  fileName?: string,
  folderId?: string,
  makePublic: boolean = false
): Promise<GoogleDriveUploadResult> => {
  const response = await apiClient.post<{ success: boolean; data: GoogleDriveUploadResult }>('/google-drive/upload', {
    filePath,
    fileName,
    folderId,
    makePublic
  });
  return response.data.data;
};

/**
 * Upload multiple files to Google Drive
 */
export const uploadMultipleToGoogleDrive = async (
  filePaths: string[],
  folderId?: string,
  makePublic: boolean = false
): Promise<{ uploaded: number; results: GoogleDriveUploadResult[] }> => {
  const response = await apiClient.post<{ success: boolean; data: { uploaded: number; results: GoogleDriveUploadResult[] } }>('/google-drive/upload-multiple', {
    filePaths,
    folderId,
    makePublic
  });
  return response.data.data;
};

/**
 * Upload a video segment to Google Drive (with summary.txt and optional transcription.txt)
 * @param folderName - Custom name for the folder to create under divideIt (optional)
 */
export const uploadSegmentToGoogleDrive = async (
  segmentPath: string,
  videoId?: string,
  folderId?: string,
  makePublic: boolean = true,
  includeSummary: boolean = true,
  includeTranscription: boolean = false,
  folderName?: string
): Promise<{
  video: { upload: GoogleDriveUploadResult; share: GoogleDriveShareResult | null };
  summary: { upload: GoogleDriveUploadResult; share: GoogleDriveShareResult | null } | null;
  transcription: { upload: GoogleDriveUploadResult; share: GoogleDriveShareResult | null } | null;
  allUploads: GoogleDriveUploadResult[];
  allShares: GoogleDriveShareResult[];
}> => {
  const response = await apiClient.post<{ success: boolean; data: any }>('/google-drive/upload-segment', {
    segmentPath,
    videoId,
    folderId,
    folderName,
    makePublic,
    includeSummary,
    includeTranscription
  });
  return response.data.data;
};

/**
 * Share a file on Google Drive
 */
export const shareGoogleDriveFile = async (
  fileId: string,
  type: 'user' | 'anyone' | 'domain',
  role: 'reader' | 'writer' | 'commenter',
  emailAddress?: string
): Promise<GoogleDriveShareResult> => {
  const response = await apiClient.post<{ success: boolean; data: GoogleDriveShareResult }>('/google-drive/share', {
    fileId,
    type,
    role,
    emailAddress
  });
  return response.data.data;
};
