# Code Examples and Usage Samples

This document provides practical code examples for using divideIt API and integrating it into your applications.

## Table of Contents

1. [Basic Usage](#basic-usage)
2. [JavaScript/TypeScript Examples](#javascripttypescript-examples)
3. [Python Examples](#python-examples)
4. [cURL Examples](#curl-examples)
5. [React Integration](#react-integration)
6. [Error Handling](#error-handling)
7. [Advanced Usage](#advanced-usage)

## Basic Usage

### Simple Video Split

```javascript
const formData = new FormData();
formData.append('video', videoFile);
formData.append('segmentCount', '5');

const response = await fetch('http://localhost:3001/api/videos/split', {
  method: 'POST',
  body: formData
});

const data = await response.json();
console.log(`Created ${data.data.totalSegments} segments`);
```

## JavaScript/TypeScript Examples

### Complete Client Class

```typescript
class DivideItClient {
  constructor(private baseUrl: string = 'http://localhost:3001/api') {}

  /**
   * Split video into segments
   */
  async splitVideo(
    videoFile: File,
    options: {
      segmentCount?: number;
      minSegmentDuration?: number;
      maxSegmentDuration?: number;
    } = {}
  ): Promise<SplitVideoResponse> {
    const formData = new FormData();
    formData.append('video', videoFile);
    
    if (options.segmentCount) {
      formData.append('segmentCount', options.segmentCount.toString());
    }
    if (options.minSegmentDuration) {
      formData.append('minSegmentDuration', options.minSegmentDuration.toString());
    }
    if (options.maxSegmentDuration) {
      formData.append('maxSegmentDuration', options.maxSegmentDuration.toString());
    }

    const response = await fetch(`${this.baseUrl}/videos/split`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to split video');
    }

    return response.json();
  }

  /**
   * Download a segment
   */
  async downloadSegment(filename: string): Promise<Blob> {
    const response = await fetch(`${this.baseUrl}/videos/download/${filename}`);
    
    if (!response.ok) {
      throw new Error('Failed to download segment');
    }
    
    return response.blob();
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<HealthResponse> {
    const response = await fetch(`${this.baseUrl}/health`);
    return response.json();
  }
}

// Usage
const client = new DivideItClient();
const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

fileInput.addEventListener('change', async (e) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;

  try {
    const result = await client.splitVideo(file, {
      segmentCount: 5,
      minSegmentDuration: 5,
      maxSegmentDuration: 60
    });

    console.log('Segments created:', result.data.segments);
    
    // Download first segment
    const filename = result.data.segments[0].downloadUrl.split('/').pop();
    const blob = await client.downloadSegment(filename!);
    
    // Create download link
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'segment_1.mp4';
    a.click();
  } catch (error) {
    console.error('Error:', error);
  }
});
```

### React Hook Example

```typescript
import { useState, useCallback } from 'react';

interface UseVideoSplitOptions {
  segmentCount?: number;
  minSegmentDuration?: number;
  maxSegmentDuration?: number;
}

export function useVideoSplit() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SplitVideoResponse | null>(null);

  const splitVideo = useCallback(async (
    file: File,
    options: UseVideoSplitOptions = {}
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('video', file);
      
      if (options.segmentCount) {
        formData.append('segmentCount', options.segmentCount.toString());
      }
      if (options.minSegmentDuration) {
        formData.append('minSegmentDuration', options.minSegmentDuration.toString());
      }
      if (options.maxSegmentDuration) {
        formData.append('maxSegmentDuration', options.maxSegmentDuration.toString());
      }

      const response = await fetch('http://localhost:3001/api/videos/split', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to split video');
      }

      const data = await response.json();
      setResult(data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const downloadSegment = useCallback(async (downloadUrl: string, filename: string) => {
    try {
      const response = await fetch(`http://localhost:3001${downloadUrl}`);
      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
      throw err;
    }
  }, []);

  return {
    splitVideo,
    downloadSegment,
    isLoading,
    error,
    result
  };
}

// Usage in component
function MyComponent() {
  const { splitVideo, downloadSegment, isLoading, error, result } = useVideoSplit();

  const handleFileSelect = async (file: File) => {
    try {
      await splitVideo(file, { segmentCount: 5 });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <input type="file" onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) handleFileSelect(file);
      }} />
      
      {isLoading && <p>Processing...</p>}
      {error && <p>Error: {error}</p>}
      
      {result && (
        <div>
          <p>Created {result.data.totalSegments} segments</p>
          {result.data.segments.map((segment) => (
            <button
              key={segment.segmentNumber}
              onClick={() => {
                const filename = segment.downloadUrl.split('/').pop()!;
                downloadSegment(segment.downloadUrl, filename);
              }}
            >
              Download Segment {segment.segmentNumber}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

## Python Examples

### Basic Client

```python
import requests
from typing import Optional, Dict, Any

class DivideItClient:
    def __init__(self, base_url: str = 'http://localhost:3001/api'):
        self.base_url = base_url

    def split_video(
        self,
        video_path: str,
        segment_count: Optional[int] = None,
        min_duration: Optional[float] = None,
        max_duration: Optional[float] = None
    ) -> Dict[str, Any]:
        """Split a video into random segments"""
        url = f'{self.base_url}/videos/split'
        files = {'video': open(video_path, 'rb')}
        data = {}
        
        if segment_count:
            data['segmentCount'] = segment_count
        if min_duration:
            data['minSegmentDuration'] = min_duration
        if max_duration:
            data['maxSegmentDuration'] = max_duration

        response = requests.post(url, files=files, data=data)
        response.raise_for_status()
        return response.json()

    def download_segment(self, filename: str, save_path: str):
        """Download a segment file"""
        url = f'{self.base_url}/videos/download/{filename}'
        response = requests.get(url, stream=True)
        response.raise_for_status()
        
        with open(save_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)

    def health_check(self) -> Dict[str, Any]:
        """Check API health"""
        response = requests.get(f'{self.base_url}/health')
        response.raise_for_status()
        return response.json()

# Usage
client = DivideItClient()

# Split video
result = client.split_video('my-video.mp4', segment_count=5)
print(f"Created {result['data']['totalSegments']} segments")

# Download segments
for segment in result['data']['segments']:
    filename = segment['downloadUrl'].split('/')[-1]
    save_path = f"segment_{segment['segmentNumber']}.mp4"
    client.download_segment(filename, save_path)
    print(f"Downloaded {save_path}")
```

### Async Python Example

```python
import aiohttp
import aiofiles
from typing import Optional, Dict, Any

class AsyncDivideItClient:
    def __init__(self, base_url: str = 'http://localhost:3001/api'):
        self.base_url = base_url

    async def split_video(
        self,
        video_path: str,
        segment_count: Optional[int] = None,
        min_duration: Optional[float] = None,
        max_duration: Optional[float] = None
    ) -> Dict[str, Any]:
        """Split a video into random segments asynchronously"""
        url = f'{self.base_url}/videos/split'
        
        data = aiohttp.FormData()
        async with aiofiles.open(video_path, 'rb') as f:
            video_data = await f.read()
            data.add_field('video', video_data, filename=video_path)
        
        if segment_count:
            data.add_field('segmentCount', str(segment_count))
        if min_duration:
            data.add_field('minSegmentDuration', str(min_duration))
        if max_duration:
            data.add_field('maxSegmentDuration', str(max_duration))

        async with aiohttp.ClientSession() as session:
            async with session.post(url, data=data) as response:
                response.raise_for_status()
                return await response.json()

    async def download_segment(self, filename: str, save_path: str):
        """Download a segment file asynchronously"""
        url = f'{self.base_url}/videos/download/{filename}'
        
        async with aiohttp.ClientSession() as session:
            async with session.get(url) as response:
                response.raise_for_status()
                async with aiofiles.open(save_path, 'wb') as f:
                    async for chunk in response.content.iter_chunked(8192):
                        await f.write(chunk)

# Usage
import asyncio

async def main():
    client = AsyncDivideItClient()
    
    result = await client.split_video('my-video.mp4', segment_count=5)
    print(f"Created {result['data']['totalSegments']} segments")
    
    # Download all segments concurrently
    tasks = []
    for segment in result['data']['segments']:
        filename = segment['downloadUrl'].split('/')[-1]
        save_path = f"segment_{segment['segmentNumber']}.mp4"
        tasks.append(client.download_segment(filename, save_path))
    
    await asyncio.gather(*tasks)
    print("All segments downloaded")

asyncio.run(main())
```

## cURL Examples

### Split Video

```bash
# Basic split
curl -X POST http://localhost:3001/api/videos/split \
  -F "video=@my-video.mp4"

# With custom parameters
curl -X POST http://localhost:3001/api/videos/split \
  -F "video=@my-video.mp4" \
  -F "segmentCount=10" \
  -F "minSegmentDuration=5" \
  -F "maxSegmentDuration=30"

# Save response to file
curl -X POST http://localhost:3001/api/videos/split \
  -F "video=@my-video.mp4" \
  -o response.json
```

### Download Segment

```bash
# Download segment
curl -O http://localhost:3001/api/videos/download/segment_1_a1b2c3d4.mp4

# Download with custom filename
curl -o my-segment.mp4 \
  http://localhost:3001/api/videos/download/segment_1_a1b2c3d4.mp4

# Show progress
curl --progress-bar -O \
  http://localhost:3001/api/videos/download/segment_1_a1b2c3d4.mp4
```

### Health Check

```bash
# Basic health check
curl http://localhost:3001/api/health

# Pretty print JSON
curl http://localhost:3001/api/health | jq

# Check readiness
curl http://localhost:3001/api/health/ready

# Check liveness
curl http://localhost:3001/api/health/live
```

## React Integration

### Complete React Component

```tsx
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface Segment {
  segmentNumber: number;
  startTime: number;
  endTime: number;
  duration: number;
  downloadUrl: string;
}

export function VideoSplitter() {
  const [file, setFile] = useState<File | null>(null);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [segmentCount, setSegmentCount] = useState(5);
  const [minDuration, setMinDuration] = useState(5);
  const [maxDuration, setMaxDuration] = useState(60);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFile(acceptedFiles[0]);
    setError(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/mp4': ['.mp4'],
      'video/quicktime': ['.mov'],
      'video/x-msvideo': ['.avi'],
    },
    maxSize: 500 * 1024 * 1024, // 500MB
  });

  const handleSplit = async () => {
    if (!file) return;

    setIsProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('video', file);
      formData.append('segmentCount', segmentCount.toString());
      formData.append('minSegmentDuration', minDuration.toString());
      formData.append('maxSegmentDuration', maxDuration.toString());

      const response = await fetch('http://localhost:3001/api/videos/split', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to split video');
      }

      const data = await response.json();
      setSegments(data.data.segments);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = async (segment: Segment) => {
    try {
      const response = await fetch(`http://localhost:3001${segment.downloadUrl}`);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `segment_${segment.segmentNumber}.mp4`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  return (
    <div className="container">
      <div {...getRootProps()} className="dropzone">
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop the video here...</p>
        ) : (
          <p>Drag & drop a video, or click to select</p>
        )}
        {file && <p>Selected: {file.name}</p>}
      </div>

      {file && (
        <div className="settings">
          <label>
            Segments: 
            <input
              type="number"
              value={segmentCount}
              onChange={(e) => setSegmentCount(parseInt(e.target.value))}
              min="1"
              max="20"
            />
          </label>
          <label>
            Min Duration: 
            <input
              type="number"
              value={minDuration}
              onChange={(e) => setMinDuration(parseFloat(e.target.value))}
              min="1"
              max="300"
            />
          </label>
          <label>
            Max Duration: 
            <input
              type="number"
              value={maxDuration}
              onChange={(e) => setMaxDuration(parseFloat(e.target.value))}
              min="1"
              max="300"
            />
          </label>
          <button onClick={handleSplit} disabled={isProcessing}>
            {isProcessing ? 'Processing...' : 'Split Video'}
          </button>
        </div>
      )}

      {error && <div className="error">{error}</div>}

      {segments.length > 0 && (
        <div className="segments">
          <h3>Segments ({segments.length})</h3>
          {segments.map((segment) => (
            <div key={segment.segmentNumber} className="segment">
              <span>Segment {segment.segmentNumber}</span>
              <span>{segment.startTime}s - {segment.endTime}s</span>
              <span>({segment.duration}s)</span>
              <button onClick={() => handleDownload(segment)}>
                Download
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

## Error Handling

### Comprehensive Error Handling

```typescript
async function splitVideoWithErrorHandling(file: File) {
  try {
    const formData = new FormData();
    formData.append('video', file);
    
    const response = await fetch('http://localhost:3001/api/videos/split', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      
      switch (response.status) {
        case 400:
          throw new Error(`Invalid request: ${errorData.error?.message}`);
        case 413:
          throw new Error('File too large. Maximum size is 500MB.');
        case 429:
          throw new Error('Rate limit exceeded. Please try again later.');
        case 500:
          throw new Error('Server error. Please try again later.');
        default:
          throw new Error(`Request failed: ${response.statusText}`);
      }
    }

    return await response.json();
  } catch (error) {
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error('Network error. Please check your connection.');
    }
    throw error;
  }
}
```

## Advanced Usage

### Batch Processing

```typescript
async function processMultipleVideos(files: File[]) {
  const results = [];
  
  for (const file of files) {
    try {
      const formData = new FormData();
      formData.append('video', file);
      
      const response = await fetch('http://localhost:3001/api/videos/split', {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        const data = await response.json();
        results.push({ file: file.name, success: true, data });
      } else {
        results.push({ file: file.name, success: false, error: response.statusText });
      }
      
      // Wait between requests to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      results.push({ file: file.name, success: false, error: error.message });
    }
  }
  
  return results;
}
```

### Progress Tracking

```typescript
async function splitVideoWithProgress(
  file: File,
  onProgress: (progress: number) => void
) {
  const formData = new FormData();
  formData.append('video', file);
  
  const xhr = new XMLHttpRequest();
  
  return new Promise((resolve, reject) => {
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const progress = (e.loaded / e.total) * 100;
        onProgress(progress);
      }
    });
    
    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        reject(new Error(`Request failed: ${xhr.statusText}`));
      }
    });
    
    xhr.addEventListener('error', () => {
      reject(new Error('Network error'));
    });
    
    xhr.open('POST', 'http://localhost:3001/api/videos/split');
    xhr.send(formData);
  });
}

// Usage
splitVideoWithProgress(file, (progress) => {
  console.log(`Upload progress: ${progress}%`);
}).then(result => {
  console.log('Split complete:', result);
});
```

## Next Steps

- See [API Reference](./API_REFERENCE.md) for complete API documentation
- Check [User Guide](./USER_GUIDE.md) for usage instructions
- Review [Troubleshooting Guide](./TROUBLESHOOTING.md) for common issues
