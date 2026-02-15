/**
 * Wrapper: add space-invaders overlay to a segment (run from repo root).
 * Delegates to backend/scripts/addGameOverlayToSegment.ts
 *
 * Usage from repo root:
 *   npx tsx scripts/addGameOverlayToSegment.ts backend/processed/<videoId>/<filename>.mp4
 *   npx tsx scripts/addGameOverlayToSegment.ts processed/<videoId>/<filename>.mp4
 */
import { spawnSync } from 'child_process';
import path from 'path';

const scriptDir = path.dirname(path.resolve(process.argv[1]));
const rootDir = path.resolve(scriptDir, '..');

let segmentPath = process.argv[2];
if (!segmentPath || !segmentPath.endsWith('.mp4')) {
  console.error('Usage: npx tsx scripts/addGameOverlayToSegment.ts <path-to-segment.mp4>');
  console.error('  Example: npx tsx scripts/addGameOverlayToSegment.ts backend/processed/506f892d-.../segment_1_....mp4');
  process.exit(1);
}
// Path relative to backend (strip "backend/" if present)
if (segmentPath.startsWith('backend/')) {
  segmentPath = segmentPath.slice('backend/'.length);
}

const out = spawnSync(
  'npx',
  ['tsx', 'scripts/addGameOverlayToSegment.ts', segmentPath],
  {
    cwd: path.join(rootDir, 'backend'),
    stdio: 'inherit',
    shell: true,
  }
);
process.exit(out.status ?? 1);
