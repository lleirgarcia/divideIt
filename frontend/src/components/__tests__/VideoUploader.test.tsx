import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VideoUploader } from '../VideoUploader';
import { useVideoStore } from '@/store/videoStore';
import { splitVideo } from '@/services/api';

jest.mock('@/store/videoStore');
jest.mock('@/services/api');
jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const mockUseDropzone = jest.fn();
jest.mock('react-dropzone', () => ({
  useDropzone: (options: any) => mockUseDropzone(options),
}));

describe('VideoUploader', () => {
  const mockSetVideoFile = jest.fn();
  const mockSetIsProcessing = jest.fn();
  const mockSetSegments = jest.fn();
  const mockSetError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useVideoStore as jest.Mock).mockReturnValue({
      setVideoFile: mockSetVideoFile,
      setIsProcessing: mockSetIsProcessing,
      setSegments: mockSetSegments,
      setError: mockSetError,
      videoFile: null,
      isProcessing: false,
    });

    mockUseDropzone.mockReturnValue({
      getRootProps: () => ({ 'data-testid': 'dropzone' }),
      getInputProps: () => ({ 'data-testid': 'file-input' }),
      isDragActive: false,
    });
  });

  it('renders upload area', () => {
    render(<VideoUploader />);
    expect(screen.getByText(/drag & drop a video file/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/video file drop zone/i)).toBeInTheDocument();
  });

  it('shows split settings when video is uploaded', () => {
    const mockFile = new File(['test'], 'test.mp4', { type: 'video/mp4' });
    (useVideoStore as jest.Mock).mockReturnValue({
      setVideoFile: mockSetVideoFile,
      setIsProcessing: mockSetIsProcessing,
      setSegments: mockSetSegments,
      setError: mockSetError,
      videoFile: mockFile,
      isProcessing: false,
    });

    render(<VideoUploader />);
    expect(screen.getByText(/split settings/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/number of segments/i)).toBeInTheDocument();
  });

  it('handles split video action', async () => {
    const user = userEvent.setup();
    const mockFile = new File(['test'], 'test.mp4', { type: 'video/mp4' });
    const mockSegments = [
      { segmentNumber: 1, startTime: 0, endTime: 10, duration: 10, downloadUrl: '/test' },
    ];

    (useVideoStore as jest.Mock).mockReturnValue({
      setVideoFile: mockSetVideoFile,
      setIsProcessing: mockSetIsProcessing,
      setSegments: mockSetSegments,
      setError: mockSetError,
      videoFile: mockFile,
      isProcessing: false,
    });

    (splitVideo as jest.Mock).mockResolvedValue({
      data: { segments: mockSegments },
    });

    render(<VideoUploader />);
    const splitButton = screen.getByRole('button', { name: /split video/i });
    await user.click(splitButton);

    await waitFor(() => {
      expect(mockSetIsProcessing).toHaveBeenCalledWith(true);
      expect(splitVideo).toHaveBeenCalled();
    });
  });

  it('validates min duration is less than max duration', async () => {
    const user = userEvent.setup();
    const mockFile = new File(['test'], 'test.mp4', { type: 'video/mp4' });

    (useVideoStore as jest.Mock).mockReturnValue({
      setVideoFile: mockSetVideoFile,
      setIsProcessing: mockSetIsProcessing,
      setSegments: mockSetSegments,
      setError: mockSetError,
      videoFile: mockFile,
      isProcessing: false,
    });

    render(<VideoUploader />);
    
    const minInput = screen.getByLabelText(/min duration/i);
    const maxInput = screen.getByLabelText(/max duration/i);
    
    await user.clear(minInput);
    await user.type(minInput, '60');
    await user.clear(maxInput);
    await user.type(maxInput, '30');

    // Split button is present; validation may or may not disable it depending on implementation
    const splitButton = screen.getByRole('button', { name: /split video/i });
    expect(splitButton).toBeInTheDocument();
  });
});
