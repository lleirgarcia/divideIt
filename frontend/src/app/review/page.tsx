'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useVideoStore, VideoSegment } from '@/store/videoStore';
import { getSegmentSummary, uploadSegmentToGoogleDrive, getGoogleDriveStatus, getGoogleDriveAuthUrl } from '@/services/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { DarkModeToggle } from '@/components/ui/DarkModeToggle';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import toast from 'react-hot-toast';

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function SegmentCard({
  segment,
  videoId,
  summaryText,
}: {
  segment: VideoSegment;
  videoId: string | null;
  summaryText: string;
}) {
  const filename = segment.downloadUrl.split('/').pop() || '';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3051';
  const videoSrc = videoId ? `${apiUrl}/api/videos/download/${filename}?videoId=${videoId}` : `${apiUrl}${segment.downloadUrl}`;

  return (
    <article className="rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 overflow-hidden shadow-sm">
      <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <h3 className="font-semibold text-gray-900 dark:text-white">
          Segment {segment.segmentNumber}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {formatTime(segment.startTime)} – {formatTime(segment.endTime)} · Duration {formatTime(segment.duration)}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
        {/* Video */}
        <div className="p-4 border-b md:border-b-0 md:border-r border-gray-100 dark:border-gray-700">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
            Video
          </h4>
          <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
            <video
              src={videoSrc}
              controls
              className="w-full h-full object-contain"
              preload="metadata"
            />
          </div>
          <a
            href={videoSrc}
            download={`segment_${segment.segmentNumber}.mp4`}
            className="text-sm text-primary-600 dark:text-primary-400 hover:underline mt-2 inline-block"
          >
            Download video
          </a>
        </div>

        {/* Written content */}
        <div className="p-4">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
            Written content
          </h4>
          <div className="min-h-[120px] max-h-48 overflow-y-auto rounded-lg bg-gray-50 dark:bg-gray-700/50 p-3 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {summaryText || (
              <span className="text-gray-400 dark:text-gray-500 italic">No summary for this segment.</span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

export default function ReviewPage() {
  const { segments, videoId, videoFile } = useVideoStore();
  const [summaries, setSummaries] = useState<Record<number, string>>({});
  const [folderName, setFolderName] = useState('');
  const [uploadingAll, setUploadingAll] = useState(false);
  const [uploadedAll, setUploadedAll] = useState(false);
  const [driveStatus, setDriveStatus] = useState<{ configured: boolean; authenticated: boolean } | null>(null);

  useEffect(() => {
    getGoogleDriveStatus()
      .then((s) => setDriveStatus(s))
      .catch(() => setDriveStatus(null));
  }, []);

  useEffect(() => {
    if (segments.length === 0 || !videoId) return;
    let cancelled = false;
    (async () => {
      const next: Record<number, string> = {};
      for (const seg of segments) {
        const filename = seg.downloadUrl.split('/').pop() || '';
        try {
          const { summary } = await getSegmentSummary(videoId, filename);
          if (!cancelled) next[seg.segmentNumber] = summary;
        } catch {
          if (!cancelled) next[seg.segmentNumber] = '';
        }
      }
      if (!cancelled) setSummaries((s) => ({ ...s, ...next }));
    })();
    return () => { cancelled = true; };
  }, [segments, videoId]);


  const handleUploadAll = async () => {
    if (!folderName.trim()) {
      toast.error('Enter a folder name for Google Drive first');
      return;
    }
    if (uploadingAll || segments.length === 0) return;

    setUploadingAll(true);
    try {
      for (const segment of segments) {
        const filename = segment.downloadUrl.split('/').pop() || '';
        await uploadSegmentToGoogleDrive(
          filename,
          videoId || undefined,
          undefined,
          true,
          true,
          false,
          folderName.trim()
        );
      }
      setUploadedAll(true);
      toast.success(`All ${segments.length} segments uploaded to folder "${folderName}"`);
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || err.message || 'Upload failed');
    } finally {
      setUploadingAll(false);
    }
  };

  const handleConnectDrive = async () => {
    try {
      const authUrl = await getGoogleDriveAuthUrl();
      window.open(authUrl, '_blank', 'width=600,height=700');
      toast.success('Complete authentication in the popup');
      setTimeout(() => getGoogleDriveStatus().then(setDriveStatus), 3000);
    } catch {
      toast.error('Failed to open Google Drive auth');
    }
  };

  if (segments.length === 0) {
    return (
      <ErrorBoundary>
        <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
          <div className="container mx-auto px-4 py-16 text-center">
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
              No processed segments. Upload and split a video first.
            </p>
            <Link
              href="/"
              className="text-primary-600 dark:text-primary-400 font-medium hover:underline"
            >
              ← Back to home
            </Link>
          </div>
        </main>
      </ErrorBoundary>
    );
  }

  const videoLabel = videoFile?.name || (videoId ? `Video ${videoId}` : 'Processed video');

  return (
    <ErrorBoundary>
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <header className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                aria-label="Back to home"
              >
                ← Back
              </Link>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Review & upload to Drive
              </h1>
            </div>
            <DarkModeToggle />
          </header>

          <div className="max-w-4xl mx-auto space-y-8">
            {/* Folder name */}
            <section className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Folder name in Google Drive
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                This name will be used for the folder created under divideIt. All segments are uploaded together to this folder.
              </p>
              <Input
                label="Folder name (ad-hoc)"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                placeholder="e.g. My Reels January 2026"
                disabled={uploadingAll || uploadedAll}
                className="max-w-md"
              />
            </section>

            {/* Drive status */}
            {driveStatus && !driveStatus.configured && (
              <section className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6">
                <p className="text-yellow-800 dark:text-yellow-200">
                  Google Drive is not configured. Set up credentials in the backend.
                </p>
              </section>
            )}
            {driveStatus?.configured && !driveStatus.authenticated && (
              <section className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 flex items-center justify-between">
                <p className="text-blue-800 dark:text-blue-200">
                  Connect to Google Drive to upload.
                </p>
                <Button onClick={handleConnectDrive}>Connect to Google Drive</Button>
              </section>
            )}

            {/* Video + segments */}
            <section className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                {videoLabel}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                {segments.length} segment{segments.length !== 1 ? 's' : ''}
              </p>

              <div className="space-y-6">
                {segments.map((segment) => (
                  <SegmentCard
                    key={segment.segmentNumber}
                    segment={segment}
                    videoId={videoId}
                    summaryText={summaries[segment.segmentNumber] ?? ''}
                  />
                ))}
              </div>

              {driveStatus?.authenticated && (
                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-600">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                    Use the folder name above and upload all segments together.
                  </p>
                  <Button
                    onClick={handleUploadAll}
                    isLoading={uploadingAll}
                    disabled={uploadingAll || !folderName.trim() || uploadedAll}
                    className="w-full md:w-auto"
                  >
                    {uploadedAll ? '✓ Uploaded' : 'Upload all segments to Drive'}
                  </Button>
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
    </ErrorBoundary>
  );
}
