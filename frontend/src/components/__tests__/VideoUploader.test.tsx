import { render, screen } from '@testing-library/react';
import { VideoUploader } from '../VideoUploader';
import { useVideoStore } from '@/store/videoStore';

jest.mock('@/store/videoStore');
jest.mock('react-dropzone', () => ({
  useDropzone: () => ({
    getRootProps: () => ({}),
    getInputProps: () => ({}),
    isDragActive: false,
  }),
}));

describe('VideoUploader', () => {
  beforeEach(() => {
    (useVideoStore as jest.Mock).mockReturnValue({
      setVideoFile: jest.fn(),
      setIsProcessing: jest.fn(),
      setSegments: jest.fn(),
      setError: jest.fn(),
      videoFile: null,
      isProcessing: false,
    });
  });

  it('renders upload area', () => {
    render(<VideoUploader />);
    expect(screen.getByText(/drag & drop a video file/i)).toBeInTheDocument();
  });
});
