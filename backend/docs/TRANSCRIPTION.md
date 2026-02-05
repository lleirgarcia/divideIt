# Video Transcription Guide

The divideIt backend supports speech-to-text transcription for videos and audio files using multiple providers.

## Supported Providers

1. **OpenAI Whisper API** (Recommended)
   - Very accurate transcription
   - Supports 100+ languages
   - Easy to set up
   - Get API key: https://platform.openai.com/api-keys

2. **AssemblyAI**
   - Good accuracy
   - Supports real-time transcription
   - Get API key: https://www.assemblyai.com/

3. **Deepgram**
   - Fast and accurate
   - Good for production use
   - Get API key: https://deepgram.com/

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure API keys** in `.env` file:
   ```env
   # At least one provider is required
   OPENAI_API_KEY=your_openai_api_key_here
   
   # Optional alternatives
   # ASSEMBLYAI_API_KEY=your_assemblyai_api_key_here
   # DEEPGRAM_API_KEY=your_deepgram_api_key_here
   ```

3. The service will automatically use the first available provider in this order:
   - OpenAI (if `OPENAI_API_KEY` is set)
   - AssemblyAI (if `ASSEMBLYAI_API_KEY` is set)
   - Deepgram (if `DEEPGRAM_API_KEY` is set)

## API Endpoints

### 1. Transcribe a Video/Audio File

**POST** `/api/videos/transcribe`

Upload a video or audio file and get its transcription.

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body:
  - `video` (File, required): Video or audio file
  - `language` (string, optional): Language code (ISO 639-1, e.g., 'en', 'es', 'fr'). Auto-detect if not provided
  - `prompt` (string, optional): Context prompt to improve accuracy
  - `responseFormat` (string, optional): Response format: 'json', 'text', 'srt', 'verbose_json', 'vtt'
  - `temperature` (number, optional): Temperature (0-1), lower = more deterministic

**Response:**
```json
{
  "success": true,
  "data": {
    "text": "Full transcribed text...",
    "language": "en",
    "duration": 120.5,
    "segments": [
      {
        "start": 0.0,
        "end": 5.2,
        "text": "First segment text..."
      }
    ],
    "provider": "openai"
  }
}
```

**Example (cURL):**
```bash
curl -X POST http://localhost:3051/api/videos/transcribe \
  -F "video=@myvideo.mp4" \
  -F "language=en" \
  -F "prompt=This is a tutorial about video editing"
```

### 2. Transcribe a Video Segment

**POST** `/api/videos/transcribe-segment/:filename`

Transcribe a specific processed video segment by filename.

**Request:**
- Method: `POST`
- URL Parameter: `filename` - Segment filename (e.g., 'segment_1_uuid.mp4')
- Query/Body Parameters (optional):
  - `language` (string): Language code
  - `prompt` (string): Context prompt

**Response:**
```json
{
  "success": true,
  "data": {
    "segmentFilename": "segment_1_a1b2c3d4.mp4",
    "text": "Transcribed segment text...",
    "language": "en",
    "duration": 15.3,
    "segments": [...],
    "provider": "openai"
  }
}
```

**Example (cURL):**
```bash
curl -X POST "http://localhost:3051/api/videos/transcribe-segment/segment_1_a1b2c3d4.mp4?language=en"
```

### 3. Get Available Transcription Providers

**GET** `/api/videos/transcription-providers`

Get list of configured transcription providers.

**Response:**
```json
{
  "success": true,
  "data": {
    "available": ["openai", "assemblyai"],
    "current": "openai"
  }
}
```

## How It Works

1. **Audio Extraction**: If a video file is provided, the service automatically extracts audio using FFmpeg
2. **Transcription**: The audio is sent to the configured transcription provider
3. **Result Processing**: The transcription result is processed and returned with metadata
4. **Cleanup**: Temporary audio files are automatically cleaned up

## Supported Languages

The service supports 100+ languages. Common language codes:
- `en` - English
- `es` - Spanish
- `fr` - French
- `de` - German
- `it` - Italian
- `pt` - Portuguese
- `ja` - Japanese
- `ko` - Korean
- `zh` - Chinese
- `ar` - Arabic
- And many more...

If `language` is not provided, the service will auto-detect the language.

## Error Handling

Common errors:

- **400 Bad Request**: Invalid file or parameters
- **404 Not Found**: Segment file not found (for segment transcription)
- **500 Internal Server Error**: Transcription failed (check API keys and provider status)

## Best Practices

1. **Language Specification**: Always specify the `language` parameter if you know it - it improves accuracy
2. **Context Prompts**: Use the `prompt` parameter to provide context (e.g., technical terms, names) for better accuracy
3. **File Size**: Keep files under 500MB for optimal performance
4. **Rate Limiting**: Transcription endpoints are rate-limited to prevent abuse

## Cost Considerations

- **OpenAI Whisper**: ~$0.006 per minute of audio
- **AssemblyAI**: Pay-as-you-go pricing
- **Deepgram**: Pay-as-you-go pricing

Check each provider's pricing page for current rates.

## Troubleshooting

**"No transcription API keys found"**
- Make sure at least one API key is set in `.env` file
- Restart the server after adding API keys

**"Transcription failed"**
- Verify your API key is valid and has credits/quota
- Check the provider's status page
- Ensure the audio file is valid and contains speech

**"File not found"**
- For segment transcription, ensure the segment file exists in the `processed/` directory
- Check the filename format matches: `segment_N_videoId_segmentId.mp4`
