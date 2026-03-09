/**
 * Crea 1 segmento para cada preset usando el primer video de uploads/.
 * Uso: npx tsx scripts/testAllPresets.ts [--account aqualityguy|agenticcmonkey]
 * Default account: aqualityguy
 */
import dotenv from 'dotenv';
dotenv.config();

import path from 'path';
import fs from 'fs/promises';
import { getVideoMetadata, generateRandomSegments, splitVideo, PRESETS, Preset } from '../src/utils/videoProcessor';
import { moveToUploadQueue } from '../src/utils/moveToUploadQueue';

const VALID_ACCOUNTS = ['aqualityguy', 'agenticcmonkey'] as const;
type Account = typeof VALID_ACCOUNTS[number];

function parseAccount(): Account {
  const idx = process.argv.indexOf('--account');
  if (idx !== -1 && process.argv[idx + 1]) {
    const val = process.argv[idx + 1];
    if (!VALID_ACCOUNTS.includes(val as Account)) {
      console.error(`Invalid account "${val}". Valid options: ${VALID_ACCOUNTS.join(', ')}`);
      process.exit(1);
    }
    return val as Account;
  }
  return 'aqualityguy';
}

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
const PROCESSED_DIR = path.join(process.cwd(), 'processed');

async function getFirstVideo(): Promise<string> {
  const files = await fs.readdir(UPLOADS_DIR);
  const videos = files.filter(f => /\.(mp4|mov|avi)$/i.test(f));
  if (videos.length === 0) throw new Error('No hay videos en uploads/');
  // El más reciente
  const withStats = await Promise.all(
    videos.map(async f => ({ f, mtime: (await fs.stat(path.join(UPLOADS_DIR, f))).mtime }))
  );
  withStats.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
  return path.join(UPLOADS_DIR, withStats[0].f);
}

async function main() {
  const account = parseAccount();
  const videoPath = await getFirstVideo();
  console.log(`\nCuenta: ${account}`);
  console.log(`Video: ${path.basename(videoPath)}`);

  const metadata = await getVideoMetadata(videoPath);
  console.log(`Duracion: ${metadata.duration.toFixed(1)}s  Resolucion: ${metadata.width}x${metadata.height}\n`);

  const presets: Preset[] = ['tiktok', 'instagram', 'instagram_zoom', 'youtube_shorts'];

  for (const preset of presets) {
    const config = PRESETS[preset];
    console.log(`\n${'='.repeat(60)}`);
    console.log(`PRESET: ${preset}`);
    console.log(`  format=${config.outputFormat}  animation=${config.animation}  dur=${config.minSegmentDuration}-${config.maxSegmentDuration}s`);
    console.log('='.repeat(60));

    const maxPossible = Math.floor(metadata.duration / config.minSegmentDuration);
    const segmentCount = Math.max(10, maxPossible);

    const segments = generateRandomSegments(
      metadata.duration,
      segmentCount,
      config.minSegmentDuration,
      config.maxSegmentDuration
    );

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
    const accountDir = path.join(PROCESSED_DIR, account);
    const outputDir = path.join(accountDir, videoId);
    await fs.mkdir(outputDir, { recursive: true });

    console.log(`  Carpeta: ${account}/${videoId}`);

    try {
      await splitVideo(videoPath, outputDir, segments, {
        outputFormat: config.outputFormat,
        animation: config.animation
      });
      console.log(`  Completado: processed/${account}/${videoId}/clip1.mp4`);
    } catch (err) {
      console.error(`  Error en preset ${preset}:`, err instanceof Error ? err.message : err);
    }

    // Pequeña pausa para evitar colisiones de timestamp
    await new Promise(r => setTimeout(r, 1500));
  }

  console.log('\n\nTodos los presets procesados.');

  // Move all generated folders to automateUploads/clip_folder/<account>/
  console.log(`\nMoviendo clips a automateUploads/clip_folder/${account}/...`);
  const accountProcessedDir = path.join(PROCESSED_DIR, account);
  try {
    const folders = await fs.readdir(accountProcessedDir);
    for (const folder of folders) {
      try {
        const { destination } = await moveToUploadQueue(folder, account, PROCESSED_DIR);
        console.log(`  ✅ ${folder} → ${destination}`);
      } catch (err) {
        console.error(`  ❌ ${folder}:`, err instanceof Error ? err.message : err);
      }
    }
  } catch {
    console.warn(`  No se encontraron carpetas en processed/${account}/`);
  }
  console.log('Listo.');
}

main().catch(err => {
  console.error('Error fatal:', err);
  process.exit(1);
});
