import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs/promises';
import { logger } from './logger';

export interface TextOverlayOptions {
  text: string;
  position?: 'top' | 'bottom' | 'center';
  fontSize?: number;
  fontColor?: string;
  backgroundColor?: string;
  backgroundColorOpacity?: number;
  fontFamily?: string;
  x?: number; // Horizontal position (0 = left, 0.5 = center, 1 = right)
  y?: number; // Vertical position (0 = top, 0.5 = center, 1 = bottom)
  padding?: number; // Padding in pixels
}

/**
 * Add text overlay to video using FFmpeg subtitles filter
 * 
 * Uses ASS subtitle format to add text overlay, which is more compatible than drawtext.
 * Adds text to video, typically in the black bar area (letterbox) for 9:16 videos.
 * 
 * @param inputPath - Path to input video file
 * @param outputPath - Path to save output video with text overlay
 * @param options - Text overlay options
 * @returns Promise that resolves when overlay is complete
 */
export async function addTextOverlayToVideo(
  inputPath: string,
  outputPath: string,
  options: TextOverlayOptions
): Promise<void> {
  const {
    text,
    position = 'top',
    fontSize = 48,
    fontColor = 'white',
    backgroundColor = 'black',
    backgroundColorOpacity = 0.7,
    fontFamily = 'Arial',
    x = 0.5, // Center horizontally
    y,
    padding = 20
  } = options;

  // Calculate Y position based on position parameter
  let yPosition: number;
  if (y !== undefined) {
    yPosition = y;
  } else {
    // Position in the top black bar area (safe zone)
    switch (position) {
      case 'top':
        // Position in upper portion of top black bar (safe from video content)
        // For 9:16 videos, top black bar is approximately 0-15% from top
        yPosition = 0.12; // 12% from top - safely in the black bar area
        break;
      case 'bottom':
        yPosition = 0.88; // 88% from top - in the bottom black bar area
        break;
      case 'center':
        yPosition = 0.5;
        break;
      default:
        yPosition = 0.12;
    }
  }

  // Create temporary ASS subtitle file
  const tempAssPath = outputPath.replace(/\.mp4$/, '_temp_subtitle.ass');
  
  // Escape text for ASS format
  const escapedText = text
    .replace(/\n/g, '\\N') // ASS uses \N for newlines
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}');

  // Convert color to ASS format (BGR instead of RGB, with alpha)
  const fontColorBGR = fontColor === 'white' ? '&H00FFFFFF' : 
                       fontColor === 'black' ? '&H00000000' :
                       fontColor.startsWith('#') ? 
                         `&H00${fontColor.slice(5)}${fontColor.slice(3,5)}${fontColor.slice(1,3)}` :
                         '&H00FFFFFF';
  
  const opacityHex = Math.round(backgroundColorOpacity * 255).toString(16).padStart(2, '0');
  const bgColorBGR = backgroundColor === 'black' ? `&H${opacityHex}000000` :
                      backgroundColor === 'white' ? `&H${opacityHex}FFFFFF` :
                      backgroundColor.startsWith('#') ?
                        `&H${opacityHex}${backgroundColor.slice(5)}${backgroundColor.slice(3,5)}${backgroundColor.slice(1,3)}` :
                        `&H${opacityHex}000000`;

  // Create ASS subtitle file
  // ASS format: [Script Info] and [V4+ Styles] sections
  const assContent = `[Script Info]
Title: Video Title Overlay
ScriptType: v4.00+

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: TitleStyle,${fontFamily},${fontSize},${fontColorBGR},${fontColorBGR},&H00000000,${bgColorBGR},0,0,0,0,100,100,0,0,1,${padding},0,5,10,10,10,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 0,0:00:00.00,99:59:59.99,TitleStyle,,0,0,0,,{\\an5\\pos(${x * 100}%,${yPosition * 100}%)}${escapedText}
`;

  await fs.writeFile(tempAssPath, assContent, 'utf-8');

  return new Promise((resolve, reject) => {
    // Use subtitles filter with ASS file
    // Convert to absolute paths for FFmpeg
    const absoluteAssPath = path.resolve(tempAssPath);
    const absoluteInputPath = path.resolve(inputPath);
    const absoluteOutputPath = path.resolve(outputPath);
    
    // Escape path for FFmpeg subtitles filter
    // The path needs to be properly escaped - replace backslashes and escape single quotes
    const escapedAssPath = absoluteAssPath
      .replace(/\\/g, '/')
      .replace(/'/g, "'\\''"); // Escape single quotes for shell
    
    // Use subtitles filter with properly escaped path
    ffmpeg(absoluteInputPath)
      .videoFilters([`subtitles='${escapedAssPath}'`])
      .outputOptions([
        '-c:v libx264',
        '-preset fast',
        '-crf 23',
        '-c:a copy', // Copy audio without re-encoding
        '-movflags +faststart',
        '-pix_fmt yuv420p'
      ])
      .output(absoluteOutputPath)
      .on('start', (commandLine) => {
        logger.info(`Adding text overlay to video: ${commandLine}`);
      })
      .on('progress', (progress) => {
        const percent = Math.round(progress.percent || 0);
        if (percent % 25 === 0) {
          logger.debug(`Text overlay progress: ${percent}%`);
        }
      })
      .on('end', async () => {
        // Clean up temporary ASS file
        try {
          await fs.unlink(tempAssPath);
        } catch (err) {
          logger.warn(`Failed to cleanup temp ASS file: ${err}`);
        }
        logger.info(`Text overlay completed: ${outputPath}`);
        resolve();
      })
      .on('error', async (err) => {
        // Clean up temporary ASS file on error
        try {
          await fs.unlink(tempAssPath);
        } catch (cleanupErr) {
          // Ignore cleanup errors
        }
        logger.error(`Error adding text overlay: ${err.message}`);
        reject(new Error(`Failed to add text overlay: ${err.message}`));
      })
      .run();
  });
}

/**
 * Add title text to video segment from title file
 * 
 * Reads the title from a _social_title.txt file and adds it as overlay to the video.
 * 
 * @param videoPath - Path to video file
 * @param titleFilePath - Path to title text file (optional, will try to find automatically)
 * @param outputPath - Path to save output video (optional, will overwrite original if not provided)
 * @returns Path to output video file
 */
export async function addTitleToVideo(
  videoPath: string,
  titleFilePath?: string,
  outputPath?: string
): Promise<string> {
  // If title file not provided, try to find it
  if (!titleFilePath) {
    const basePath = videoPath.replace(/\.mp4$/, '');
    const possibleTitlePath = `${basePath}_social_title.txt`;
    
    try {
      await fs.access(possibleTitlePath);
      titleFilePath = possibleTitlePath;
    } catch {
      throw new Error(`Title file not found. Expected: ${path.basename(possibleTitlePath)}`);
    }
  }

  // Read title text
  const titleText = await fs.readFile(titleFilePath, 'utf-8').then(text => text.trim());

  if (!titleText) {
    throw new Error('Title file is empty');
  }

  // Determine output path
  const finalOutputPath = outputPath || videoPath.replace(/\.mp4$/, '_with_title.mp4');

  // Add text overlay
  await addTextOverlayToVideo(videoPath, finalOutputPath, {
    text: titleText,
    position: 'top',
    fontSize: 48,
    fontColor: 'white',
    backgroundColor: 'black',
    backgroundColorOpacity: 0.7,
    padding: 20
  });

  return finalOutputPath;
}
