import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const apiClient = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});

export interface SplitVideoResponse {
  success: boolean;
  data: {
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

export const splitVideo = async (formData: FormData): Promise<SplitVideoResponse> => {
  const response = await apiClient.post<SplitVideoResponse>('/videos/split', formData);
  return response.data;
};

export const downloadSegment = async (downloadUrl: string): Promise<Blob> => {
  const response = await axios.get(`${API_URL}${downloadUrl}`, {
    responseType: 'blob',
  });
  return response.data;
};
