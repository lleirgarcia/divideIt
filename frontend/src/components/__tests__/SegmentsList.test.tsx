import { render, screen } from '@testing-library/react';
import { SegmentsList } from '../SegmentsList';
import { useVideoStore } from '@/store/videoStore';
import { resetVideoStore, createMockSegments } from '../../__tests__/helpers/testHelpers';

jest.mock('@/store/videoStore');
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));
jest.mock('../ui/Button', () => ({
  Button: ({ children, onClick, isLoading }: any) => (
    <button onClick={onClick} disabled={isLoading} data-testid="download-button">
      {isLoading ? 'Downloading...' : children}
    </button>
  ),
}));

describe('SegmentsList', () => {
  beforeEach(() => {
    resetVideoStore();
    global.fetch = jest.fn();
  });

  it('should display message when no segments', () => {
    (useVideoStore as jest.Mock).mockReturnValue({
      segments: [],
      isProcessing: false,
    });

    render(<SegmentsList />);
    expect(screen.getByText(/no segments generated yet/i)).toBeInTheDocument();
  });

  it('should display segments when available', () => {
    const mockSegments = createMockSegments(3);
    (useVideoStore as jest.Mock).mockReturnValue({
      segments: mockSegments,
      isProcessing: false,
    });

    render(<SegmentsList />);
    
    expect(screen.getByText(/segment 1/i)).toBeInTheDocument();
    expect(screen.getByText(/segment 2/i)).toBeInTheDocument();
    expect(screen.getByText(/segment 3/i)).toBeInTheDocument();
  });

  it('should display segment duration correctly', () => {
    const mockSegments = createMockSegments(1);
    (useVideoStore as jest.Mock).mockReturnValue({
      segments: mockSegments,
      isProcessing: false,
    });

    render(<SegmentsList />);
    // Duration is shown in aria-label and as (0:10)
    expect(screen.getByLabelText(/duration: 0:10/i)).toBeInTheDocument();
  });

  it('should have download buttons for each segment', () => {
    const mockSegments = createMockSegments(2);
    (useVideoStore as jest.Mock).mockReturnValue({
      segments: mockSegments,
      isProcessing: false,
    });

    render(<SegmentsList />);
    const downloadButtons = screen.getAllByTestId('download-button');
    expect(downloadButtons.length).toBe(2);
  });
});
