#!/usr/bin/env node
/**
 * One-off script: renames files in a processed folder from
 * segment_N_uuid.* to clipN.* format (and _social_description → _caption).
 * Usage: node scripts/rename-processed-to-clip-format.js <processedFolderPath>
 */

const fs = require('fs');
const path = require('path');

const dir = process.argv[2];
if (!dir || !fs.existsSync(dir)) {
  console.error('Usage: node rename-processed-to-clip-format.js <processedFolderPath>');
  process.exit(1);
}

const files = fs.readdirSync(dir);
// segment_<N>_<uuid> or segment_<N>_<uuid>_<suffix><.ext>
const re = /^segment_(\d+)_[a-f0-9-]+(?:_(summary|social_title|social_description|original_no_title|with_title|with_title_temp_text))?(\.[a-z0-9]+)?$/;

function newName(oldName) {
  const m = oldName.match(re);
  if (!m) return null;
  const num = m[1];
  const part2 = m[2];   // e.g. 'summary', 'social_description'
  const ext = m[3] || ''; // e.g. '.mp4', '.txt'
  if (part2 === 'social_description') return `clip${num}_caption.txt`;
  if (part2 === 'with_title_temp_text') return `clip${num}_with_title_temp_text.png`;
  if (part2 === 'with_title') return `clip${num}_with_title.mp4`;
  if (part2) return `clip${num}_${part2}${ext || '.txt'}`;
  return `clip${num}${ext}`;
}

const toRename = [];
for (const f of files) {
  const newF = newName(f);
  if (newF && newF !== f) toRename.push({ old: f, new: newF });
}

// Sort so we don't overwrite: do renames that don't conflict (e.g. segment_1_xxx → clip1) - no conflict since names are different
for (const { old: oldName, new: newName } of toRename) {
  const oldPath = path.join(dir, oldName);
  const newPath = path.join(dir, newName);
  if (oldPath === newPath) continue;
  fs.renameSync(oldPath, newPath);
  console.log(`${oldName} → ${newName}`);
}
console.log(`Renamed ${toRename.length} files.`);
