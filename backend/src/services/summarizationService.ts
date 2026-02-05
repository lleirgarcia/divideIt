import axios from 'axios';
import { logger } from '../utils/logger';
import fs from 'fs/promises';

export interface SummarizationOptions {
  maxLength?: number; // Maximum length of summary in words
  language?: string; // Language for summary (ISO 639-1 code)
  style?: 'concise' | 'detailed' | 'bullet-points' | 'social-media'; // Summary style
}

export interface SocialMediaContent {
  description: string; // Description optimized for TikTok/Instagram Reels
  title: string; // Short title (5-7 words)
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
      language: _language = 'en',
      style = 'concise'
    } = options;

    // Build prompt based on style
    let prompt = '';
    switch (style) {
      case 'bullet-points':
        prompt = `Summarize the following text in ${maxLength} words or less as bullet points:\n\n${text}`;
        break;
      case 'detailed':
        prompt = `Provide a detailed summary of the following text in approximately ${maxLength} words:\n\n${text}`;
        break;
      case 'social-media':
        prompt = `Create an engaging description for a TikTok or Instagram Reel based on this video transcription. The description should be:
- Engaging and hook the viewer
- Include relevant hashtags suggestions
- Be optimized for social media (catchy, clear, and action-oriented)
- Maximum ${maxLength} words
- Written in English only

Video transcription:\n\n${text}`;
        break;
      case 'concise':
      default:
        prompt = `Summarize the following text concisely in ${maxLength} words or less:\n\n${text}`;
        break;
    }

    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `You are a helpful assistant that creates clear and accurate summaries. Always respond in English only, regardless of the input language.`
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
      language: _lang = 'en'
    } = options;

    try {
      // Generate description for social media
      const descriptionResponse = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `You are a social media content creator expert. Create engaging descriptions for TikTok and Instagram Reels that hook viewers, include relevant hashtag suggestions, and are optimized for engagement. Always respond in English only, regardless of the input language.`
            },
            {
              role: 'user',
              content: `Create an engaging description for a TikTok or Instagram Reel based on this video transcription. The description should be:
- Engaging and hook the viewer in the first sentence
- Include 3-5 relevant hashtag suggestions at the end
- Be optimized for social media (catchy, clear, and action-oriented)
- Maximum ${maxLength} words
- Written in English only

Video transcription:\n\n${text}`
            }
          ],
          max_tokens: Math.min(maxLength * 2, 300),
          temperature: 0.7 // Slightly higher for more creative descriptions
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const description = descriptionResponse.data.choices[0]?.message?.content?.trim();
      
      if (!description) {
        throw new Error('No description generated from OpenAI');
      }

      // Generate short title (5-7 words)
      const titleResponse = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `You are a social media expert. Create catchy, short titles (exactly 5-7 words) for TikTok and Instagram Reels. Titles should be attention-grabbing and summarize the video content. Always respond in English only, regardless of the input language. Respond ONLY with the title, no additional text.`
            },
            {
              role: 'user',
              content: `Based on this video transcription, create a catchy title of exactly 5-7 words in English for a TikTok/Instagram Reel. The title should be attention-grabbing and summarize the main point. Respond ONLY with the title in English, nothing else.\n\nVideo transcription:\n\n${text}`
            }
          ],
          max_tokens: 30,
          temperature: 0.6
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      let title = titleResponse.data.choices[0]?.message?.content?.trim();
      
      // Clean up title - remove quotes if present, ensure it's 5-7 words
      if (title) {
        title = title.replace(/^["']|["']$/g, ''); // Remove surrounding quotes
        const wordCount = title.split(/\s+/).length;
        if (wordCount > 7) {
          // If too long, take first 7 words
          title = title.split(/\s+/).slice(0, 7).join(' ');
        }
      } else {
        title = 'Video Content';
      }

      logger.debug(`Social media content generated: ${title.substring(0, 30)}...`);
      
      return {
        description: description,
        title: title
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
    const descriptionPath = `${basePath}_social_description.txt`;
    const titlePath = `${basePath}_social_title.txt`;

    // Write description and title to separate files
    await fs.writeFile(descriptionPath, content.description, 'utf-8');
    await fs.writeFile(titlePath, content.title, 'utf-8');

    logger.info(`Social media content saved: ${descriptionPath} and ${titlePath}`);
    
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
