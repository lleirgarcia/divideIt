/**
 * Moves a processed clip folder from divideIt/processed/<account>/<videoId>/
 * to automateUploads/clip_folder/<account>/<videoId>/
 */
import path from 'path';
import fs from 'fs/promises';

const AUTOMATE_UPLOADS_CLIP_FOLDER = path.resolve(
  __dirname,
  '../../../../automateUploads/clip_folder'
);

export async function moveToUploadQueue(
  videoId: string,
  account: string,
  processedDir: string
): Promise<{ destination: string }> {
  const source = path.join(processedDir, account, videoId);
  const destAccount = path.join(AUTOMATE_UPLOADS_CLIP_FOLDER, account);
  const destination = path.join(destAccount, videoId);

  // Verify source exists
  try {
    await fs.access(source);
  } catch {
    throw new Error(`Source folder not found: ${source}`);
  }

  // Verify destination project exists
  try {
    await fs.access(AUTOMATE_UPLOADS_CLIP_FOLDER);
  } catch {
    throw new Error(`automateUploads/clip_folder not found at: ${AUTOMATE_UPLOADS_CLIP_FOLDER}`);
  }

  // Create account subfolder if needed
  await fs.mkdir(destAccount, { recursive: true });

  // Move (rename across same filesystem; fallback to copy+delete)
  try {
    await fs.rename(source, destination);
  } catch (err: any) {
    if (err.code === 'EXDEV') {
      // Cross-device move: copy then delete
      await copyDir(source, destination);
      await fs.rm(source, { recursive: true, force: true });
    } else {
      throw err;
    }
  }

  return { destination };
}

async function copyDir(src: string, dest: string): Promise<void> {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}
