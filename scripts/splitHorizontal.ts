/**
 * Divide un video en clips horizontales (16:9, 1920x1080).
 * Uso: npx tsx scripts/splitHorizontal.ts <ruta-al-video.mp4> [numSegmentos] [minDuracion] [maxDuracion]
 * Ejemplo: npx tsx scripts/splitHorizontal.ts uploads/mi-video.mp4 3 10 60
 */

import path from 'path';
import fs from 'fs/promises';
import { getVideoMetadata, generateRandomSegments, splitVideo } from '../backend/src/utils/videoProcessor';

async function main() {
  const relativePath = process.argv[2];
  if (!relativePath || !relativePath.endsWith('.mp4')) {
    console.error('Uso: npx tsx scripts/splitHorizontal.ts <ruta-al-video.mp4> [numSegmentos] [minDuracion] [maxDuracion]');
    process.exit(1);
  }

  const videoPath = path.resolve(relativePath);
  try {
    await fs.access(videoPath);
  } catch {
    console.error('Archivo no encontrado:', videoPath);
    process.exit(1);
  }

  const numSegments   = parseInt(process.argv[3] || '3');
  const minDuration   = parseFloat(process.argv[4] || '5');
  const maxDuration   = parseFloat(process.argv[5] || '60');

  const metadata = await getVideoMetadata(videoPath);
  console.log(`Video: ${path.basename(videoPath)}`);
  console.log(`Duracion: ${metadata.duration.toFixed(2)}s — Resolucion original: ${metadata.width}x${metadata.height}`);
  console.log(`Formato de salida: horizontal (1920x1080)`);
  console.log(`Segmentos: ${numSegments}, duracion ${minDuration}s–${maxDuration}s\n`);

  const segments = generateRandomSegments(metadata.duration, numSegments, minDuration, maxDuration);
  if (segments.length === 0) {
    console.error('El video es demasiado corto para generar segmentos con esos parametros.');
    process.exit(1);
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
  const outputDir = path.resolve('processed', timestamp);

  const result = await splitVideo(videoPath, outputDir, segments, { outputFormat: 'horizontal' });

  console.log(`\nListo. ${result.length} clips en: ${outputDir}`);
  result.forEach((seg, i) => {
    console.log(`  clip${i + 1}.mp4 — ${seg.startTime.toFixed(2)}s → ${seg.endTime.toFixed(2)}s`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
