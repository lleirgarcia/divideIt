import axios from 'axios';
import { logger } from '../utils/logger';
import fs from 'fs/promises';
import { buildStyleBlock } from './styleService';

export interface SummarizationOptions {
  maxLength?: number; // Maximum length of summary in words
  language?: string; // Language for summary (ISO 639-1 code)
  style?: 'concise' | 'detailed' | 'bullet-points' | 'social-media'; // Summary style
}

export interface SocialMediaContent {
  description: string; // Description optimized for TikTok/Instagram Reels/YouTube Shorts
  title: string; // Short title (5-7 words)
  tweets: [string, string]; // 2 tweets for X (max 280 chars each)
}

/**
 * Summarization Service
 * 
 * Uses OpenAI GPT to summarize text content.
 * Supports multiple summary styles and languages.
 */
export class SummarizationService {
  /**
   * Load API key from environment variables
   * Called each time to ensure fresh values
   */
  private getApiKey(): string | undefined {
    return process.env.OPENAI_API_KEY;
  }

  /**
   * Model to use for summarization. Default: gpt-4o-mini (smarter than gpt-3.5-turbo).
   * Override with OPENAI_SUMMARIZATION_MODEL (e.g. gpt-4o for best quality).
   */
  private getModel(): string {
    return process.env.OPENAI_SUMMARIZATION_MODEL || 'gpt-4o-mini';
  }

  /**
   * Summarize text using OpenAI GPT
   */
  async summarize(
    text: string,
    options: SummarizationOptions = {}
  ): Promise<string> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not set. Summarization requires OpenAI API key.');
    }

    if (!text || text.trim().length === 0) {
      return 'No content to summarize.';
    }

    const {
      maxLength = 100,
      language = 'es',
      style = 'concise'
    } = options;

    const langInstruction = language === 'es' ? 'Spanish (español)' : language === 'en' ? 'English' : `language code ${language}`;

    // Build prompt based on style
    let prompt = '';
    switch (style) {
      case 'bullet-points':
        prompt = `Summarize the following text in ${maxLength} words or less as bullet points. Respond in ${langInstruction} only.\n\n${text}`;
        break;
      case 'detailed':
        prompt = `Provide a detailed summary of the following text in approximately ${maxLength} words. Respond in ${langInstruction} only.\n\n${text}`;
        break;
      case 'social-media':
        prompt = `Create an engaging description for a TikTok or Instagram Reel based on this video transcription. The description should be:
- Engaging and hook the viewer
- Include relevant hashtags suggestions
- Be optimized for social media (catchy, clear, and action-oriented)
- Maximum ${maxLength} words
- Written in ${langInstruction} only

Video transcription:\n\n${text}`;
        break;
      case 'concise':
      default:
        prompt = `Summarize the following text concisely in ${maxLength} words or less. Respond in ${langInstruction} only.\n\n${text}`;
        break;
    }

    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: this.getModel(),
          messages: [
            {
              role: 'system',
              content: `You are a helpful assistant that creates clear and accurate summaries. Always respond in ${langInstruction} only, regardless of the input language.`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: Math.min(maxLength * 2, 500), // Rough estimate: 2 tokens per word
          temperature: 0.3 // Lower temperature for more consistent summaries
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const summary = response.data.choices[0]?.message?.content?.trim();
      
      if (!summary) {
        throw new Error('No summary generated from OpenAI');
      }

      logger.debug(`Summary generated: ${summary.substring(0, 50)}...`);
      return summary;
    } catch (error: any) {
      logger.error(`Summarization error: ${error.message}`);
      throw new Error(`Failed to summarize text: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Summarize text from a file and save summary to a new file
   * 
   * @param txtFilePath - Path to the .txt file containing the text to summarize
   * @param summaryFilePath - Optional path for the summary file. If not provided, creates one based on txtFilePath
   * @param options - Summarization options
   * @returns Path to the created summary file
   */
  async summarizeFile(
    txtFilePath: string,
    summaryFilePath?: string,
    options: SummarizationOptions = {}
  ): Promise<string> {
    // Read the text file
    const text = await fs.readFile(txtFilePath, 'utf-8');

    // Generate summary
    const summary = await this.summarize(text, options);

    // Determine output file path
    const outputPath = summaryFilePath || txtFilePath.replace(/\.txt$/, '_summary.txt');

    // Write summary to file
    await fs.writeFile(outputPath, summary, 'utf-8');

    logger.info(`Summary saved to: ${outputPath}`);
    return outputPath;
  }

  /**
   * Generate social media content (description + title) for TikTok/Instagram Reels
   */
  async generateSocialMediaContent(
    text: string,
    options: SummarizationOptions = {}
  ): Promise<SocialMediaContent> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not set. Summarization requires OpenAI API key.');
    }

    if (!text || text.trim().length === 0) {
      return {
        description: 'No content available.',
        title: 'Video Content'
      };
    }

    const {
      maxLength = 150,
      language = 'es'
    } = options;

    const langInstruction = language === 'es' ? 'Spanish (español)' : language === 'en' ? 'English' : `language code ${language}`;

    const styleBlock = await buildStyleBlock();

    const systemPrompt = `Eres el asistente de contenido de @aqualityguy. Tu único trabajo es escribir exactamente como él: directo, sin rodeos, con energía, cercano, usando sus expresiones naturales en español. No suenas a ChatGPT ni a copywriter genérico.${styleBlock}

Responde siempre en ${langInstruction}.`;

    try {
      // Generar descripción + título + tweets en una sola llamada
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: this.getModel(),
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: `Basándote en esta transcripción de un vídeo corto, genera el siguiente contenido en JSON con exactamente esta estructura:

{
  "description": "Caption para Instagram Reels, YouTube Shorts y TikTok. Sin emojis. Tono directo, primera frase engancha, termina con 1-2 hashtags relevantes. Máximo ${maxLength} palabras.",
  "title": "Título de 5-7 palabras exactas. Sin emojis. Directo.",
  "tweets": [
    "Tweet 1 con la idea principal del vídeo (max 280 caracteres)",
    "Tweet 2 con una reflexión o provocación relacionada (max 280 caracteres)"
  ]
}

Responde SOLO con el JSON, sin texto adicional.

Transcripción:\n\n${text}`
            }
          ],
          max_tokens: 600,
          temperature: 0.5
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const raw = response.data.choices[0]?.message?.content?.trim();
      if (!raw) throw new Error('No content generated from OpenAI');

      const parsed = JSON.parse(raw.replace(/^```json\n?|```$/g, '').trim());

      let title = (parsed.title || 'Video Content').replace(/^["']|["']$/g, '');
      const wordCount = title.split(/\s+/).length;
      if (wordCount > 7) title = title.split(/\s+/).slice(0, 7).join(' ');

      const tweets: [string, string] = [
        (parsed.tweets?.[0] || '').slice(0, 280),
        (parsed.tweets?.[1] || '').slice(0, 280),
      ];

      logger.debug(`Social media content generated: ${title}`);

      return {
        description: parsed.description || '',
        title,
        tweets,
      };
    } catch (error: any) {
      logger.error(`Social media content generation error: ${error.message}`);
      throw new Error(`Failed to generate social media content: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Generate social media content from a file and save to files
   */
  async generateSocialMediaContentFromFile(
    txtFilePath: string,
    options: SummarizationOptions = {}
  ): Promise<{ descriptionPath: string; titlePath: string; content: SocialMediaContent }> {
    // Read the text file
    const text = await fs.readFile(txtFilePath, 'utf-8');

    // Generate social media content
    const content = await this.generateSocialMediaContent(text, options);

    // Determine output file paths
    const basePath = txtFilePath.replace(/\.txt$/, '');
    const descriptionPath = `${basePath}_caption.txt`;
    const titlePath = `${basePath}_social_title.txt`;

    const tweetsPath = `${basePath}_tweets.txt`;

    // Write description, title and tweets to separate files
    await fs.writeFile(descriptionPath, content.description, 'utf-8');
    await fs.writeFile(titlePath, content.title, 'utf-8');
    await fs.writeFile(tweetsPath, content.tweets.join('\n\n---\n\n'), 'utf-8');

    logger.info(`Social media content saved: ${descriptionPath}, ${titlePath}, ${tweetsPath}`);

    return {
      descriptionPath,
      titlePath,
      content
    };
  }

  /**
   * Check if summarization is available (API key configured)
   */
  isAvailable(): boolean {
    return !!this.getApiKey();
  }
}

export const summarizationService = new SummarizationService();
