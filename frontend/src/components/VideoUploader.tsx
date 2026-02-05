'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useVideoStore } from '@/store/videoStore';
import { splitVideo } from '@/services/api';
import toast from 'react-hot-toast';
import clsx from 'clsx';

export function VideoUploader() {
  const { setVideoFile, setIsProcessing, setSegments, setError, videoFile, isProcessing } = useVideoStore();
  const [segmentCount, setSegmentCount] = useState(5);
  const [minDuration, setMinDuration] = useState(5);
  const [maxDuration, setMaxDuration] = useState(60);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setVideoFile(file);
      setError(null);
      toast.success('Video uploaded successfully');
    }
  }, [setVideoFile, setError]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/mp4': ['.mp4'],
      'video/quicktime': ['.mov'],
      'video/x-msvideo': ['.avi'],
    },
    maxFiles: 1,
    maxSize: 500 * 1024 * 1024, // 500MB
  });

  const handleSplit = async () => {
    if (!videoFile) {
      toast.error('Please upload a video first');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('video', videoFile);
      formData.append('segmentCount', segmentCount.toString());
      formData.append('minSegmentDuration', minDuration.toString());
      formData.append('maxSegmentDuration', maxDuration.toString());

      const response = await splitVideo(formData);
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
    <div className="space-y-6">
      <div
        {...getRootProps()}
        className={clsx(
          'border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors',
          isDragActive
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-primary-400 dark:hover:border-primary-600',
          'bg-white dark:bg-gray-800'
        )}
      >
        <input {...getInputProps()} />
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
            </div>
          ) : (
            <div>
              <p className="text-lg font-medium text-gray-900 dark:text-white">
                {isDragActive ? 'Drop the video here' : 'Drag & drop a video file'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                or click to select (MP4, MOV, AVI - Max 500MB)
              </p>
            </div>
          )}
        </div>
      </div>

      {videoFile && (
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Split Settings
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Number of Segments
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={segmentCount}
                onChange={(e) => setSegmentCount(parseInt(e.target.value) || 5)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Min Duration (seconds)
              </label>
              <input
                type="number"
                min="1"
                max="300"
                value={minDuration}
                onChange={(e) => setMinDuration(parseFloat(e.target.value) || 5)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Max Duration (seconds)
              </label>
              <input
                type="number"
                min="1"
                max="300"
                value={maxDuration}
                onChange={(e) => setMaxDuration(parseFloat(e.target.value) || 60)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-white"
              />
            </div>
          </div>

          <button
            onClick={handleSplit}
            disabled={isProcessing}
            className={clsx(
              'w-full py-3 px-4 rounded-md font-medium text-white transition-colors',
              isProcessing
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2'
            )}
          >
            {isProcessing ? 'Processing...' : 'Split Video'}
          </button>
        </div>
      )}
    </div>
  );
}
