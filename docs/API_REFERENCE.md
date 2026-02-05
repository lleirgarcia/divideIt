# API Reference

Complete API reference for divideIt backend.

## Base URL

- **Development**: `http://localhost:3001/api`
- **Production**: `https://api.divideit.example.com/api`

## Authentication

Currently, no authentication is required. Future versions may include API key authentication.

## Rate Limiting

- **General API**: 100 requests per 15 minutes per IP
- **Upload Endpoint**: 10 requests per hour per IP

Rate limit headers are included in responses:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests in window
- `X-RateLimit-Reset`: Time when limit resets (Unix timestamp)

## Response Format

### Success Response

```json
{
  "success": true,
  "data": {
    // Response data
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "message": "Error message description"
  }
}
```

## Endpoints

### Health Check

#### GET `/health`

Check API server health status.

**Response**: `200 OK`

```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600
}
```

**Example**:
```bash
curl http://localhost:3001/api/health
```

---

### Split Video

#### POST `/videos/split`

Upload a video file and split it into random segments.

**Content-Type**: `multipart/form-data`

**Request Body**:
- `video` (file, required): Video file (MP4, MOV, or AVI, max 1GB)
- `segmentCount` (integer, optional): Number of segments (1-20, default: 5)
- `minSegmentDuration` (number, optional): Minimum segment duration in seconds (1-300, default: 5)
- `maxSegmentDuration` (number, optional): Maximum segment duration in seconds (1-300, default: 60)

**Response**: `200 OK`

```json
{
  "success": true,
  "data": {
    "originalVideo": {
      "filename": "my-video.mp4",
      "duration": 120.5,
      "metadata": {
        "duration": 120.5,
        "width": 1920,
        "height": 1080,
        "format": "mov,mp4,m4a,3gp,3g2,mj2",
        "size": 52428800
      }
    },
    "segments": [
      {
        "segmentNumber": 1,
        "startTime": 10.5,
        "endTime": 25.3,
        "duration": 14.8,
        "downloadUrl": "/api/videos/download/segment_1_a1b2c3d4.mp4"
      },
      {
        "segmentNumber": 2,
        "startTime": 45.2,
        "endTime": 78.9,
        "duration": 33.7,
        "downloadUrl": "/api/videos/download/segment_2_e5f6g7h8.mp4"
      }
    ],
    "totalSegments": 2
  }
}
```

**Error Responses**:

`400 Bad Request` - Invalid file or parameters
```json
{
  "success": false,
  "error": {
    "message": "Invalid file type. Only MP4, MOV, and AVI files are allowed."
  }
}
```

`413 Payload Too Large` - File exceeds 1GB
```json
{
  "success": false,
  "error": {
    "message": "File too large. Maximum size is 1GB."
  }
}
```

`429 Too Many Requests` - Rate limit exceeded
```json
{
  "success": false,
  "error": {
    "message": "Too many requests from this IP, please try again later."
  }
}
```

`500 Internal Server Error` - Server error
```json
{
  "success": false,
  "error": {
    "message": "An internal server error occurred"
  }
}
```

**Example**:
```bash
curl -X POST http://localhost:3001/api/videos/split \
  -F "video=@my-video.mp4" \
  -F "segmentCount=5" \
  -F "minSegmentDuration=5" \
  -F "maxSegmentDuration=60"
```

**JavaScript Example**:
```javascript
const formData = new FormData();
formData.append('video', fileInput.files[0]);
formData.append('segmentCount', '5');
formData.append('minSegmentDuration', '5');
formData.append('maxSegmentDuration', '60');

const response = await fetch('http://localhost:3001/api/videos/split', {
  method: 'POST',
  body: formData
});

const data = await response.json();
console.log(data);
```

**Python Example**:
```python
import requests

url = 'http://localhost:3001/api/videos/split'
files = {'video': open('my-video.mp4', 'rb')}
data = {
    'segmentCount': 5,
    'minSegmentDuration': 5,
    'maxSegmentDuration': 60
}

response = requests.post(url, files=files, data=data)
print(response.json())
```

---

### Download Segment

#### GET `/videos/download/{filename}`

Download a processed video segment.

**Parameters**:
- `filename` (path parameter, required): Segment filename (e.g., `segment_1_a1b2c3d4.mp4`)

**Response**: `200 OK`

Returns the video file as binary data with `Content-Type: video/mp4`.

**Error Responses**:

`404 Not Found` - Segment file not found
```json
{
  "success": false,
  "error": {
    "message": "File not found"
  }
}
```

**Example**:
```bash
curl -O http://localhost:3001/api/videos/download/segment_1_a1b2c3d4.mp4
```

**JavaScript Example**:
```javascript
const downloadUrl = '/api/videos/download/segment_1_a1b2c3d4.mp4';

// Method 1: Direct download
window.location.href = downloadUrl;

// Method 2: Fetch and download
const response = await fetch(downloadUrl);
const blob = await response.blob();
const url = window.URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'segment_1.mp4';
a.click();
```

**Python Example**:
```python
import requests

url = 'http://localhost:3001/api/videos/download/segment_1_a1b2c3d4.mp4'
response = requests.get(url, stream=True)

with open('segment_1.mp4', 'wb') as f:
    for chunk in response.iter_content(chunk_size=8192):
        f.write(chunk)
```

---

## Data Models

### VideoMetadata

```typescript
interface VideoMetadata {
  duration: number;      // Video duration in seconds
  width: number;         // Video width in pixels
  height: number;        // Video height in pixels
  format: string;        // Container format (e.g., "mov,mp4,m4a,3gp,3g2,mj2")
  size: number;          // File size in bytes
}
```

### VideoSegment

```typescript
interface VideoSegment {
  segmentNumber: number;   // Sequential segment number (1-indexed)
  startTime: number;       // Start time in seconds
  endTime: number;         // End time in seconds
  duration: number;        // Segment duration in seconds
  downloadUrl: string;      // URL to download the segment
}
```

### OriginalVideo

```typescript
interface OriginalVideo {
  filename: string;        // Original filename
  duration: number;         // Video duration in seconds
  metadata: VideoMetadata; // Video metadata
}
```

### SplitVideoResponse

```typescript
interface SplitVideoResponse {
  success: boolean;
  data: {
    originalVideo: OriginalVideo;
    segments: VideoSegment[];
    totalSegments: number;
  };
}
```

---

## Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Bad Request - Invalid input |
| 404 | Not Found - Resource doesn't exist |
| 413 | Payload Too Large - File exceeds limit |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Server error |

---

## Validation Rules

### File Upload

- **Formats**: MP4, MOV, AVI
- **Max Size**: 1GB
- **MIME Types**: 
  - `video/mp4`
  - `video/quicktime`
  - `video/x-msvideo`

### Segment Parameters

- **segmentCount**: Integer between 1 and 20 (inclusive)
- **minSegmentDuration**: Number between 1 and 300 (inclusive) seconds
- **maxSegmentDuration**: Number between 1 and 300 (inclusive) seconds
- **Constraint**: `minSegmentDuration` must be less than or equal to `maxSegmentDuration`
- **Constraint**: Video duration must be greater than `minSegmentDuration`

---

## Error Handling

All errors follow a consistent format:

```json
{
  "success": false,
  "error": {
    "message": "Human-readable error message"
  }
}
```

Common error scenarios:

1. **Invalid File Type**: File doesn't match allowed formats
2. **File Too Large**: File exceeds 1GB limit
3. **Invalid Parameters**: Parameters outside allowed ranges
4. **Video Too Short**: Video duration less than minimum segment duration
5. **Processing Failure**: FFmpeg processing error
6. **Rate Limit**: Too many requests in time window
7. **File Not Found**: Requested segment doesn't exist

---

## Best Practices

### Request Handling

1. **Always check response status**: Verify `success` field
2. **Handle errors gracefully**: Check for error messages
3. **Respect rate limits**: Implement exponential backoff
4. **Validate input**: Check file format and size client-side
5. **Show progress**: Display upload and processing progress

### File Management

1. **Download immediately**: Segments are temporary
2. **Handle large files**: Show progress indicators
3. **Validate formats**: Check before upload
4. **Error recovery**: Retry on transient errors

### Performance

1. **Optimize videos**: Compress before upload
2. **Batch operations**: Process multiple videos sequentially
3. **Cache responses**: Cache metadata when possible
4. **Monitor rate limits**: Track remaining requests

---

## OpenAPI Specification

For complete API specification, see [openapi.yaml](./api/openapi.yaml).

You can use tools like:
- [Swagger UI](https://swagger.io/tools/swagger-ui/)
- [Postman](https://www.postman.com/)
- [Insomnia](https://insomnia.rest/)

To import and test the API.

---

## SDK Examples

### JavaScript/TypeScript

```typescript
class DivideItClient {
  constructor(private baseUrl: string = 'http://localhost:3001/api') {}

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

  async downloadSegment(filename: string): Promise<Blob> {
    const response = await fetch(`${this.baseUrl}/videos/download/${filename}`);
    if (!response.ok) {
      throw new Error('Failed to download segment');
    }
    return response.blob();
  }
}
```

### Python

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
        url = f'{self.base_url}/videos/download/{filename}'
        response = requests.get(url, stream=True)
        response.raise_for_status()
        
        with open(save_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
```

---

## Support

For API support:
- Check [Troubleshooting Guide](./TROUBLESHOOTING.md)
- Review [User Guide](./USER_GUIDE.md)
- Open an issue on GitHub
