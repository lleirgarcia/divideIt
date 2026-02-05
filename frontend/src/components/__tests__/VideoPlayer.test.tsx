import { render, screen } from '@testing-library/react';
import { VideoPlayer } from '../VideoPlayer';
import { useVideoStore } from '@/store/videoStore';
import { resetVideoStore } from '../../__tests__/helpers/testHelpers';

jest.mock('@/store/videoStore');
jest.mock('react-player', () => ({
  __esModule: true,
  default: ({ url }: { url: string }) => <div data-testid="react-player">Playing: {url}</div>,
}));

describe('VideoPlayer', () => {
  beforeEach(() => {
    resetVideoStore();
  });

  it('should display "No video uploaded" when no video URL', () => {
    (useVideoStore as jest.Mock).mockReturnValue({
      videoUrl: null,
    });

    render(<VideoPlayer />);
    expect(screen.getByText(/no video uploaded/i)).toBeInTheDocument();
  });

  it('should render video player area when video URL is provided', () => {
    const mockUrl = 'blob:http://localhost:3000/test-video';
    (useVideoStore as jest.Mock).mockReturnValue({
      videoUrl: mockUrl,
    });

    render(<VideoPlayer />);
    // With lazy-loaded ReactPlayer we see either the player or loading state
    const region = screen.getByRole('region', { name: /video player/i });
    expect(region).toBeInTheDocument();
    expect(screen.queryByText(/no video uploaded/i)).not.toBeInTheDocument();
  });

  it('should have correct aspect ratio container', () => {
    (useVideoStore as jest.Mock).mockReturnValue({
      videoUrl: 'blob:http://localhost:3000/test-video',
    });

    const { container } = render(<VideoPlayer />);
    const aspectContainer = container.querySelector('.aspect-video');
    expect(aspectContainer).toBeInTheDocument();
  });
});
