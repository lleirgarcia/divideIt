import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs/promises';
import { createCanvas } from 'canvas';
import { logger } from './logger';

export interface TextOverlayOptions {
  text: string;
  position?: 'top' | 'bottom' | 'center';
  fontSize?: number;
  fontColor?: string;
  backgroundColor?: string;
  backgroundColorOpacity?: number;
  fontFamily?: string;
  fontWeight?: string; // Font weight: 'normal', 'bold', '600', '700', etc.
  x?: number; // Horizontal position (0 = left, 0.5 = center, 1 = right)
  y?: number; // Vertical position (0 = top, 0.5 = center, 1 = bottom)
  padding?: number; // Padding in pixels
}

/**
 * Generate text image using Canvas
 * Creates a compact image with just the text and background, not full video size
 */
async function generateTextImage(
  text: string,
  options: TextOverlayOptions,
  outputPath: string,
  videoWidth: number = 1080,
  _videoHeight: number = 1920
): Promise<{ imagePath: string; imageWidth: number; imageHeight: number }> {
  const {
    fontSize = 48,
    fontColor = 'white',
    backgroundColor = 'black',
    backgroundColorOpacity = 0.7,
    fontFamily = 'Arial',
    fontWeight = 'normal',
    padding = 20
  } = options;

  // Build font string with weight
  const fontString = fontWeight !== 'normal' 
    ? `${fontWeight} ${fontSize}px ${fontFamily}`
    : `${fontSize}px ${fontFamily}`;

  // Calculate maximum box width (90% of video width to leave margins)
  const maxBoxWidth = Math.floor(videoWidth * 0.9);
  const maxTextWidth = maxBoxWidth - (padding * 2);

  // Create a temporary canvas to measure text
  const measureCanvas = createCanvas(1, 1);
  const measureCtx = measureCanvas.getContext('2d');
  measureCtx.font = fontString;
  
  // Measure text and wrap if necessary
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = measureCtx.measureText(testLine);
    
    if (metrics.width <= maxTextWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) {
        lines.push(currentLine);
      }
      // If single word is too long, try to fit it anyway (will be clipped but visible)
      currentLine = word;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }

  // Calculate box dimensions
  const lineHeight = fontSize * 1.2; // Line height with spacing
  const textHeight = lines.length * lineHeight;
  const boxHeight = textHeight + (padding * 2);
  
  // Measure the longest line to determine box width
  let maxLineWidth = 0;
  for (const line of lines) {
    const metrics = measureCtx.measureText(line);
    maxLineWidth = Math.max(maxLineWidth, Math.ceil(metrics.width));
  }
  
  // Ensure box width doesn't exceed maxBoxWidth
  const boxWidth = Math.min(maxLineWidth + (padding * 2), maxBoxWidth);

  // Create canvas with calculated size
  const canvas = createCanvas(boxWidth, boxHeight);
  const ctx = canvas.getContext('2d');

  // Set font with weight
  ctx.font = fontString;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  // Draw background box (full canvas)
  const bgColor = backgroundColor === 'black' ? 'rgba(0, 0, 0, ' + backgroundColorOpacity + ')' :
                  backgroundColor === 'white' ? 'rgba(255, 255, 255, ' + backgroundColorOpacity + ')' :
                  backgroundColor.startsWith('#') ? 
                    backgroundColor + Math.round(backgroundColorOpacity * 255).toString(16).padStart(2, '0') :
                    'rgba(0, 0, 0, ' + backgroundColorOpacity + ')';

  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, boxWidth, boxHeight);

  // Draw text lines (centered in the box)
  const textColor = fontColor === 'white' ? '#FFFFFF' :
                    fontColor === 'black' ? '#000000' :
                    fontColor.startsWith('#') ? fontColor : '#FFFFFF';

  ctx.fillStyle = textColor;
  lines.forEach((line, index) => {
    const y = padding + (index * lineHeight);
    ctx.fillText(line, boxWidth / 2, y);
  });

  // Save as PNG
  const buffer = canvas.toBuffer('image/png');
  await fs.writeFile(outputPath, buffer);

  return {
    imagePath: outputPath,
    imageWidth: boxWidth,
    imageHeight: boxHeight
  };
}

/**
 * Add text overlay to video using Canvas-generated image and overlay filter
 * 
 * This is an alternative to subtitles filter that doesn't require libass.
 * Generates a PNG image with text and overlays it on the video.
 */
export async function addTextOverlayToVideo(
  inputPath: string,
  outputPath: string,
  options: TextOverlayOptions
): Promise<void> {
  // Get video dimensions
  const videoMetadata = await new Promise<{ width: number; height: number }>((resolve, reject) => {
    ffmpeg.ffprobe(inputPath, (err, metadata) => {
      if (err) {
        reject(err);
        return;
      }
      const videoStream = metadata.streams.find(s => s.codec_type === 'video');
      if (!videoStream) {
        reject(new Error('No video stream found'));
        return;
      }
      resolve({
        width: videoStream.width || 1080,
        height: videoStream.height || 1920
      });
    });
  });

  // Generate compact text image (just the text box, not full video size)
  const tempImagePath = outputPath.replace(/\.mp4$/, '_temp_text.png');
  const { imageWidth, imageHeight } = await generateTextImage(
    options.text, 
    options, 
    tempImagePath, 
    videoMetadata.width, 
    videoMetadata.height
  );

  // Calculate overlay position - center horizontally, position in top black bar
  // For 9:16 videos (1920px height), top black bar is ~0-288px (15%)
  // Center the text vertically in the black bar area
  let yPosition: number;
  if (options.y !== undefined) {
    // If y is provided as a ratio, convert to pixels
    yPosition = Math.round(videoMetadata.height * options.y);
  } else {
    switch (options.position || 'top') {
      case 'top':
        // Position in the top black bar area, lower to match user's red box
        // Position at ~14% from top (269px for 1920px height) to be lower in the black bar
        // User requested to lower it a bit more
        const blackBarPosition = Math.round(videoMetadata.height * 0.14); // 14% from top
        yPosition = blackBarPosition - Math.round(imageHeight / 2) + 5; // Center the text box vertically + 5px down
        // Ensure it doesn't go negative
        yPosition = Math.max(0, yPosition);
        break;
      case 'bottom':
        // Center vertically in the bottom black bar (85-100% of height)
        const bottomBlackBarCenter = Math.round(videoMetadata.height * 0.925); // 92.5% from top
        yPosition = bottomBlackBarCenter - Math.round(imageHeight / 2);
        // Ensure it doesn't go below the video
        yPosition = Math.min(yPosition, videoMetadata.height - imageHeight);
        break;
      case 'center':
        yPosition = Math.round((videoMetadata.height - imageHeight) / 2);
        break;
      default:
        const defaultBlackBarPosition = Math.round(videoMetadata.height * 0.14);
        yPosition = Math.max(0, defaultBlackBarPosition - Math.round(imageHeight / 2) + 5); // +5px down
    }
  }

  // Calculate overlay position ensuring it stays within video bounds
  // Center horizontally: (W-w)/2, but ensure it doesn't go outside video edges
  const centerX = Math.round((videoMetadata.width - imageWidth) / 2);
  const overlayX = Math.max(0, Math.min(centerX, videoMetadata.width - imageWidth));
  
  // Ensure Y position doesn't go outside video bounds
  const overlayY = Math.max(0, Math.min(yPosition, videoMetadata.height - imageHeight));

  return new Promise((resolve, reject) => {
    const absoluteInputPath = path.resolve(inputPath);
    const absoluteImagePath = path.resolve(tempImagePath);
    const absoluteOutputPath = path.resolve(outputPath);

    // Overlay filter: center horizontally, position vertically
    // Position is calculated to ensure overlay stays within video bounds
    ffmpeg(absoluteInputPath)
      .input(absoluteImagePath)
      .complexFilter([
        `[0:v][1:v]overlay=${overlayX}:${overlayY}[out]`
      ])
      .outputOptions([
        '-map [out]',
        '-map 0:a?',
        '-c:v libx264',
        '-preset fast',
        '-crf 23',
        '-c:a copy',
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
        // Clean up temporary image
        try {
          await fs.unlink(tempImagePath);
        } catch (err) {
          logger.warn(`Failed to cleanup temp image: ${err}`);
        }
        logger.info(`Text overlay completed: ${outputPath}`);
        resolve();
      })
      .on('error', async (err) => {
        // Clean up temporary image on error
        try {
          await fs.unlink(tempImagePath);
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

  // Add text overlay - positioned in top black bar, centered horizontally
  await addTextOverlayToVideo(videoPath, finalOutputPath, {
    text: titleText,
    position: 'top',
    fontSize: 56, // Slightly larger for better visibility
    fontColor: 'white',
    backgroundColor: 'black',
    backgroundColorOpacity: 0.8, // More opaque background for better readability
    padding: 25, // More padding for better visibility
    fontWeight: 'bold', // Bold font for better visibility
    x: 0.5 // Center horizontally
  });

  return finalOutputPath;
}
