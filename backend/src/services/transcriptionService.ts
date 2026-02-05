import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { logger } from '../utils/logger';
import ffmpeg from 'fluent-ffmpeg';
import FormData from 'form-data';
import axios from 'axios';

export interface TranscriptionResult {
  text: string;
  language?: string;
  segments?: Array<{
    start: number;
    end: number;
    text: string;
  }>;
  duration: number;
}

export interface TranscriptionOptions {
  language?: string; // ISO 639-1 code (e.g., 'en', 'es', 'fr')
  prompt?: string; // Context prompt to improve accuracy
  responseFormat?: 'json' | 'text' | 'srt' | 'verbose_json' | 'vtt';
  temperature?: number; // 0-1, lower = more deterministic
}

/**
 * Transcription Service
 * 
 * Supports multiple transcription providers:
 * - OpenAI Whisper API (default, recommended)
 * - AssemblyAI (alternative)
 * - Deepgram (alternative)
 */
export class TranscriptionService {
  private provider: 'openai' | 'assemblyai' | 'deepgram' = 'openai';
  private openaiApiKey?: string;
  private assemblyaiApiKey?: string;
  private deepgramApiKey?: string;

  constructor() {
    // Load API keys lazily - reload from environment each time to ensure fresh values
    this.loadApiKeys();
  }

  /**
   * Load API keys from environment variables
   * Called in constructor and can be called again to refresh keys
   */
  private loadApiKeys(): void {
    this.openaiApiKey = process.env.OPENAI_API_KEY;
    this.assemblyaiApiKey = process.env.ASSEMBLYAI_API_KEY;
    this.deepgramApiKey = process.env.DEEPGRAM_API_KEY;

    // Default to OpenAI if available, otherwise use first available
    if (this.openaiApiKey) {
      this.provider = 'openai';
    } else if (this.assemblyaiApiKey) {
      this.provider = 'assemblyai';
    } else if (this.deepgramApiKey) {
      this.provider = 'deepgram';
    } else {
      this.provider = 'openai'; // Default, but will fail if no API key
      logger.warn('No transcription API keys found. Set OPENAI_API_KEY, ASSEMBLYAI_API_KEY, or DEEPGRAM_API_KEY');
    }
  }

  /**
   * Extract audio from video file
   * 
   * Converts video to audio format suitable for transcription (WAV or MP3)
   */
  private async extractAudio(
    videoPath: string,
    outputPath?: string
  ): Promise<string> {
    const audioPath = outputPath || videoPath.replace(/\.[^/.]+$/, '.wav');
    const tempDir = path.dirname(audioPath);

    await fs.mkdir(tempDir, { recursive: true });

    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .outputOptions([
          '-vn', // No video
          '-acodec pcm_s16le', // PCM 16-bit little-endian
          '-ar 16000', // Sample rate 16kHz (good for speech)
          '-ac 1' // Mono channel
        ])
        .output(audioPath)
        .on('end', () => {
          logger.debug(`Audio extracted: ${audioPath}`);
          resolve(audioPath);
        })
        .on('error', (err) => {
          logger.error(`Error extracting audio: ${err.message}`);
          reject(new Error(`Failed to extract audio: ${err.message}`));
        })
        .run();
    });
  }

  /**
   * Transcribe audio/video using OpenAI Whisper API
   */
  private async transcribeWithOpenAI(
    audioPath: string,
    options: TranscriptionOptions = {}
  ): Promise<TranscriptionResult> {
    if (!this.openaiApiKey) {
      throw new Error('OPENAI_API_KEY is not set');
    }

    const formData = new FormData();
    formData.append('file', fsSync.createReadStream(audioPath));
    formData.append('model', 'whisper-1');
    
    if (options.language) {
      formData.append('language', options.language);
    }
    if (options.prompt) {
      formData.append('prompt', options.prompt);
    }
    if (options.responseFormat) {
      formData.append('response_format', options.responseFormat);
    }
    if (options.temperature !== undefined) {
      formData.append('temperature', options.temperature.toString());
    }

    try {
      const response = await axios.post(
        'https://api.openai.com/v1/audio/transcriptions',
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            'Authorization': `Bearer ${this.openaiApiKey}`,
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
        }
      );

      // Get audio duration for metadata
      const metadata = await this.getAudioDuration(audioPath);

      return {
        text: response.data.text || '',
        language: response.data.language,
        duration: metadata.duration,
      };
    } catch (error: any) {
      logger.error(`OpenAI transcription error: ${error.message}`);
      throw new Error(`Transcription failed: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Transcribe audio/video using AssemblyAI
   */
  private async transcribeWithAssemblyAI(
    audioPath: string,
    options: TranscriptionOptions = {}
  ): Promise<TranscriptionResult> {
    if (!this.assemblyaiApiKey) {
      throw new Error('ASSEMBLYAI_API_KEY is not set');
    }

    // Step 1: Upload audio file
    const fileData = await fs.readFile(audioPath);
    const uploadResponse = await axios.post(
      'https://api.assemblyai.com/v2/upload',
      fileData,
      {
        headers: {
          'authorization': this.assemblyaiApiKey,
          'content-type': 'application/octet-stream',
        },
      }
    );

    const uploadUrl = uploadResponse.data.upload_url;

    // Step 2: Start transcription
    const transcriptResponse = await axios.post(
      'https://api.assemblyai.com/v2/transcript',
      {
        audio_url: uploadUrl,
        language_code: options.language || 'auto',
      },
      {
        headers: {
          'authorization': this.assemblyaiApiKey,
          'content-type': 'application/json',
        },
      }
    );

    const transcriptId = transcriptResponse.data.id;

    // Step 3: Poll for results
    let transcript;
    while (true) {
      const statusResponse = await axios.get(
        `https://api.assemblyai.com/v2/transcript/${transcriptId}`,
        {
          headers: {
            'authorization': this.assemblyaiApiKey,
          },
        }
      );

      transcript = statusResponse.data;

      if (transcript.status === 'completed') {
        break;
      } else if (transcript.status === 'error') {
        throw new Error(`Transcription failed: ${transcript.error}`);
      }

      // Wait 3 seconds before checking again
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    const metadata = await this.getAudioDuration(audioPath);

    return {
      text: transcript.text || '',
      language: transcript.language_code,
      segments: transcript.words?.map((word: any) => ({
        start: word.start / 1000, // Convert to seconds
        end: word.end / 1000,
        text: word.text,
      })),
      duration: metadata.duration,
    };
  }

  /**
   * Transcribe audio/video using Deepgram
   */
  private async transcribeWithDeepgram(
    audioPath: string,
    options: TranscriptionOptions = {}
  ): Promise<TranscriptionResult> {
    if (!this.deepgramApiKey) {
      throw new Error('DEEPGRAM_API_KEY is not set');
    }

    const fileData = await fs.readFile(audioPath);
    const language = options.language || 'auto';

    try {
      const response = await axios.post(
        `https://api.deepgram.com/v1/listen?language=${language}&punctuate=true&model=nova`,
        fileData,
        {
          headers: {
            'Authorization': `Token ${this.deepgramApiKey}`,
            'Content-Type': 'audio/wav',
          },
        }
      );

      const result = response.data.results;
      const metadata = await this.getAudioDuration(audioPath);

      return {
        text: result.channels[0].alternatives[0].transcript || '',
        language: result.language,
        segments: result.channels[0].alternatives[0].words?.map((word: any) => ({
          start: word.start,
          end: word.end,
          text: word.word,
        })),
        duration: metadata.duration,
      };
    } catch (error: any) {
      logger.error(`Deepgram transcription error: ${error.message}`);
      throw new Error(`Transcription failed: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Get audio duration
   */
  private async getAudioDuration(audioPath: string): Promise<{ duration: number }> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(audioPath, (err, metadata) => {
        if (err) {
          reject(new Error(`Failed to get audio duration: ${err.message}`));
          return;
        }
        resolve({
          duration: metadata.format.duration || 0,
        });
      });
    });
  }

  /**
   * Transcribe video or audio file
   * 
   * Automatically extracts audio from video files if needed.
   * Supports multiple providers based on available API keys.
   */
  async transcribe(
    filePath: string,
    options: TranscriptionOptions = {}
  ): Promise<TranscriptionResult> {
    // Reload API keys to ensure we have the latest values
    this.loadApiKeys();
    let audioPath = filePath;
    let isTempAudio = false;

    try {
      // Check if file is video (has video stream) or audio
      const isVideo = await this.isVideoFile(filePath);

      if (isVideo) {
        // Extract audio from video
        logger.info(`Extracting audio from video: ${filePath}`);
        audioPath = path.join(
          path.dirname(filePath),
          `audio_${Date.now()}.wav`
        );
        audioPath = await this.extractAudio(filePath, audioPath);
        isTempAudio = true;
      }

      logger.info(`Transcribing using ${this.provider}...`);

      // Transcribe based on provider
      let result: TranscriptionResult;
      switch (this.provider) {
        case 'openai':
          result = await this.transcribeWithOpenAI(audioPath, options);
          break;
        case 'assemblyai':
          result = await this.transcribeWithAssemblyAI(audioPath, options);
          break;
        case 'deepgram':
          result = await this.transcribeWithDeepgram(audioPath, options);
          break;
        default:
          throw new Error(`Unknown transcription provider: ${this.provider}`);
      }

      return result;
    } finally {
      // Clean up temporary audio file if created
      if (isTempAudio && audioPath !== filePath) {
        try {
          await fs.unlink(audioPath);
          logger.debug(`Cleaned up temporary audio file: ${audioPath}`);
        } catch (error) {
          logger.warn(`Failed to cleanup temp audio file: ${error}`);
        }
      }
    }
  }

  /**
   * Check if file is a video file
   */
  private async isVideoFile(filePath: string): Promise<boolean> {
    return new Promise((resolve) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          resolve(false);
          return;
        }
        const hasVideoStream = metadata.streams.some(
          stream => stream.codec_type === 'video'
        );
        resolve(hasVideoStream);
      });
    });
  }

  /**
   * Get available transcription providers
   */
  getAvailableProviders(): string[] {
    // Reload API keys to ensure we have the latest values
    this.loadApiKeys();
    const providers: string[] = [];
    if (this.openaiApiKey) providers.push('openai');
    if (this.assemblyaiApiKey) providers.push('assemblyai');
    if (this.deepgramApiKey) providers.push('deepgram');
    return providers;
  }

  /**
   * Get current provider
   */
  getCurrentProvider(): string {
    return this.provider;
  }
}

export const transcriptionService = new TranscriptionService();
