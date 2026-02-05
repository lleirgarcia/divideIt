'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useVideoStore } from '@/store/videoStore';
import { splitVideo } from '@/services/api';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { LoadingSkeleton } from './ui/LoadingSkeleton';

export function VideoUploader() {
  const { setVideoFile, setIsProcessing, setSegments, setVideoId, setError, videoFile, isProcessing } = useVideoStore();
  const [segmentCount, setSegmentCount] = useState('');
  const [minDuration, setMinDuration] = useState('');
  const [maxDuration, setMaxDuration] = useState('');
  const [fileError, setFileError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0];
      if (rejection.errors.some((e: any) => e.code === 'file-too-large')) {
        setFileError('File size exceeds 1GB limit');
        toast.error('File size exceeds 1GB limit');
      } else if (rejection.errors.some((e: any) => e.code === 'file-invalid-type')) {
        setFileError('Invalid file type. Please upload MP4, MOV, or AVI files');
        toast.error('Invalid file type');
      } else {
        setFileError('Failed to upload file');
        toast.error('Failed to upload file');
      }
      return;
    }

    const file = acceptedFiles[0];
    if (file) {
      setVideoFile(file);
      setError(null);
      setFileError(null);
      toast.success('Video uploaded successfully');
    }
  }, [setVideoFile, setError]);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: {
      'video/mp4': ['.mp4'],
      'video/quicktime': ['.mov'],
      'video/x-msvideo': ['.avi'],
    },
    maxFiles: 1,
    maxSize: 1024 * 1024 * 1024, // 1GB
    disabled: isProcessing,
    noClick: false,
    noKeyboard: false,
  });

  const handleSplit = async () => {
    if (!videoFile) {
      toast.error('Please upload a video first');
      return;
    }

    const segCount = segmentCount === '' ? 5 : parseInt(String(segmentCount), 10);
    const minD = minDuration === '' ? 5 : parseFloat(String(minDuration));
    const maxD = maxDuration === '' ? 60 : parseFloat(String(maxDuration));

    if (Number.isNaN(segCount) || segCount < 1 || segCount > 20) {
      toast.error('Number of segments must be between 1 and 20');
      return;
    }
    if (Number.isNaN(minD) || minD < 1 || minD > 300) {
      toast.error('Min duration must be between 1 and 300 seconds');
      return;
    }
    if (Number.isNaN(maxD) || maxD < 1 || maxD > 300) {
      toast.error('Max duration must be between 1 and 300 seconds');
      return;
    }
    if (minD >= maxD) {
      toast.error('Min duration must be less than max duration');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('video', videoFile);
      formData.append('segmentCount', String(segCount));
      formData.append('minSegmentDuration', String(minD));
      formData.append('maxSegmentDuration', String(maxD));

      const response = await splitVideo(formData);
      setVideoId(response.data.videoId);
      setSegments(response.data.segments);
      toast.success(`Successfully created ${response.data.segments.length} segments!`);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || error.message || 'Failed to split video';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6" role="region" aria-label="Video upload and split settings">
      <div
        {...getRootProps()}
        className={clsx(
          'border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
          isDragActive
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-primary-400 dark:hover:border-primary-600',
          isProcessing && 'opacity-50 cursor-not-allowed',
          'bg-white dark:bg-gray-800'
        )}
        aria-label="Video file drop zone"
        aria-describedby="dropzone-description"
        tabIndex={isProcessing ? -1 : 0}
      >
        <input {...getInputProps()} aria-label="Upload video file" />
        <div className="space-y-4">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
            aria-hidden="true"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {videoFile ? (
            <div>
              <p className="text-lg font-medium text-gray-900 dark:text-white">
                {videoFile.name}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {(videoFile.size / (1024 * 1024)).toFixed(2)} MB
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  open();
                }}
                className="mt-2"
                aria-label="Choose a different video"
              >
                Choose another video
              </Button>
            </div>
          ) : (
            <div>
              <p className="text-lg font-medium text-gray-900 dark:text-white">
                {isDragActive ? 'Drop the video here' : 'Drag & drop a video file'}
              </p>
              <p id="dropzone-description" className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                or click the button below to select a file (MP4, MOV, AVI - Max 1GB)
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  open();
                }}
                className="mt-3"
                disabled={isProcessing}
                aria-label="Open file dialog to select video"
              >
                Select video file
              </Button>
            </div>
          )}
        </div>
      </div>

      {fileError && (
        <div
          className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
          role="alert"
        >
          <p className="text-sm text-red-800 dark:text-red-200">{fileError}</p>
        </div>
      )}

      {videoFile && (
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Split Settings
          </h3>

          {isProcessing ? (
            <div className="space-y-4">
              <LoadingSkeleton variant="text" lines={3} />
              <LoadingSkeleton height={48} />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Number of Segments"
                  type="number"
                  min={1}
                  max={20}
                  value={segmentCount}
                  onChange={(e) => setSegmentCount(e.target.value)}
                  helperText="Between 1 and 20 segments"
                  aria-label="Number of segments to create"
                />

                <Input
                  label="Min Duration (seconds)"
                  type="number"
                  min={1}
                  max={300}
                  step={0.1}
                  value={minDuration}
                  onChange={(e) => setMinDuration(e.target.value)}
                  helperText="Minimum segment length"
                  aria-label="Minimum segment duration in seconds"
                />

                <Input
                  label="Max Duration (seconds)"
                  type="number"
                  min={1}
                  max={300}
                  step={0.1}
                  value={maxDuration}
                  onChange={(e) => setMaxDuration(e.target.value)}
                  helperText="Maximum segment length"
                  aria-label="Maximum segment duration in seconds"
                />
              </div>

              <Button
                onClick={handleSplit}
                isLoading={isProcessing}
                disabled={isProcessing}
                className="w-full"
                aria-label="Split video into segments"
              >
                Split Video
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
