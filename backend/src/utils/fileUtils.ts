import fs from 'fs/promises';
import path from 'path';

/**
 * Ensures a directory exists, creating it recursively if it doesn't
 * 
 * Checks if the directory exists and creates it with all parent directories
 * if it doesn't. Uses recursive option to create parent directories as needed.
 * 
 * @param {string} dirPath - Path to the directory
 * @returns {Promise<void>} Promise that resolves when directory is ensured
 * 
 * @example
 * await ensureDirectoryExists('./uploads');
 * await ensureDirectoryExists('./processed/videos');
 */
export const ensureDirectoryExists = async (dirPath: string): Promise<void> => {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
};

/**
 * Gets the file extension from a filename
 * 
 * Extracts the extension (including the dot) and converts it to lowercase.
 * Returns empty string if no extension found.
 * 
 * @param {string} filename - The filename
 * @returns {string} File extension in lowercase (e.g., '.mp4', '.mov')
 * 
 * @example
 * getFileExtension('video.mp4'); // Returns '.mp4'
 * getFileExtension('VIDEO.MOV'); // Returns '.mov'
 * getFileExtension('file'); // Returns ''
 */
export const getFileExtension = (filename: string): string => {
  return path.extname(filename).toLowerCase();
};

/**
 * Checks if a file exists at the given path
 * 
 * Uses fs.access to check file existence without throwing errors.
 * Returns true if file exists, false otherwise.
 * 
 * @param {string} filePath - Path to the file
 * @returns {Promise<boolean>} Promise resolving to true if file exists
 * 
 * @example
 * const exists = await fileExists('./uploads/video.mp4');
 * if (exists) { /* handle file *\/ }
 */
export const fileExists = async (filePath: string): Promise<boolean> => {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};

/**
 * Gets the size of a file in bytes
 * 
 * Retrieves file statistics and returns the size property.
 * Throws an error if the file doesn't exist.
 * 
 * @param {string} filePath - Path to the file
 * @returns {Promise<number>} Promise resolving to file size in bytes
 * 
 * @throws {Error} If file doesn't exist or cannot be accessed
 * 
 * @example
 * const size = await getFileSize('./uploads/video.mp4');
 * const sizeInMB = size / (1024 * 1024);
 */
export const getFileSize = async (filePath: string): Promise<number> => {
  const stats = await fs.stat(filePath);
  return stats.size;
};
