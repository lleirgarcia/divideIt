/**
 * Genera clips para instagram, instagram_zoom y youtube_shorts para aqualityguy.
 * Uso: npx tsx scripts/splitIgYt.ts
 */
import dotenv from 'dotenv';
dotenv.config();

import path from 'path';
import fs from 'fs/promises';
import { getVideoMetadata, generateRandomSegments, splitVideo, PRESETS, Preset } from '../src/utils/videoProcessor';
import { moveToUploadQueue } from '../src/utils/moveToUploadQueue';

const ACCOUNT = 'aqualityguy';
const PRESETS_TO_RUN: Preset[] = ['instagram', 'instagram_zoom', 'youtube_shorts'];

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
const PROCESSED_DIR = path.join(process.cwd(), 'processed');

async function getFirstVideo(): Promise<string> {
  const files = await fs.readdir(UPLOADS_DIR);
  const videos = files.filter(f => /\.(mp4|mov|avi)$/i.test(f));
  if (videos.length === 0) throw new Error('No hay videos en uploads/');
  const withStats = await Promise.all(
    videos.map(async f => ({ f, mtime: (await fs.stat(path.join(UPLOADS_DIR, f))).mtime }))
  );
  withStats.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
  return path.join(UPLOADS_DIR, withStats[0].f);
}

async function main() {
  const videoPath = await getFirstVideo();
  console.log(`\nCuenta: ${ACCOUNT}`);
  console.log(`Video: ${path.basename(videoPath)}`);

  const metadata = await getVideoMetadata(videoPath);
  console.log(`Duracion: ${metadata.duration.toFixed(1)}s  Resolucion: ${metadata.width}x${metadata.height}\n`);

  for (const preset of PRESETS_TO_RUN) {
    const config = PRESETS[preset];
    console.log(`\n${'='.repeat(60)}`);
    console.log(`PRESET: ${preset}`);
    console.log(`  format=${config.outputFormat}  animation=${config.animation}  dur=${config.minSegmentDuration}-${config.maxSegmentDuration}s`);
    console.log('='.repeat(60));

    const maxPossible = Math.floor(metadata.duration / config.minSegmentDuration);
    const segmentCount = Math.min(20, maxPossible);

    const segments = generateRandomSegments(
      metadata.duration,
      segmentCount,
      config.minSegmentDuration,
      config.maxSegmentDuration
    ).slice(0, 20);

    if (segments.length === 0) {
      console.warn(`  Video demasiado corto para este preset (min ${config.minSegmentDuration}s). Saltando.`);
      continue;
    }

    const now = new Date();
    const timestamp =
      now.getFullYear() +
      String(now.getMonth() + 1).padStart(2, '0') +
      String(now.getDate()).padStart(2, '0') +
      '_' +
      String(now.getHours()).padStart(2, '0') +
      String(now.getMinutes()).padStart(2, '0') +
      String(now.getSeconds()).padStart(2, '0');
    const videoId = `${config.folderPrefix}${timestamp}`;
    const accountDir = path.join(PROCESSED_DIR, ACCOUNT);
    const outputDir = path.join(accountDir, videoId);
    await fs.mkdir(outputDir, { recursive: true });

    console.log(`  Carpeta: ${ACCOUNT}/${videoId}`);

    try {
      await splitVideo(videoPath, outputDir, segments, {
        outputFormat: config.outputFormat,
        animation: config.animation
      });
      console.log(`  Completado: processed/${ACCOUNT}/${videoId}/clip1.mp4`);
    } catch (err) {
      console.error(`  Error en preset ${preset}:`, err instanceof Error ? err.message : err);
    }

    await new Promise(r => setTimeout(r, 1500));
  }

  console.log('\n\nPresets procesados.');

  console.log(`\nMoviendo clips a automateUploads/clip_folder/${ACCOUNT}/...`);
  const accountProcessedDir = path.join(PROCESSED_DIR, ACCOUNT);
  try {
    const folders = await fs.readdir(accountProcessedDir);
    for (const folder of folders) {
      try {
        const { destination } = await moveToUploadQueue(folder, ACCOUNT, PROCESSED_DIR);
        console.log(`  ✅ ${folder} → ${destination}`);
      } catch (err) {
        console.error(`  ❌ ${folder}:`, err instanceof Error ? err.message : err);
      }
    }
  } catch {
    console.warn(`  No se encontraron carpetas en processed/${ACCOUNT}/`);
  }
  console.log('Listo.');

  // Eliminar el video original de uploads/
  try {
    await fs.unlink(videoPath);
    console.log(`\nVideo eliminado de uploads/: ${path.basename(videoPath)}`);
  } catch (err) {
    console.warn(`No se pudo eliminar el video original: ${err instanceof Error ? err.message : err}`);
  }
}

main().catch(err => {
  console.error('Error fatal:', err);
  process.exit(1);
});
