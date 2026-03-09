import fs from 'fs/promises';
import path from 'path';
import { logger } from '../utils/logger';

const YOUTUBE_PIPELINE_OUTPUTS = path.resolve(
  __dirname,
  '../../../../youtube-pipeline/data/outputs'
);

const EXCERPT_WORDS = 250;
const NUM_EXAMPLES = 4;

function pickWords(text: string, count: number): string {
  return text.split(/\s+/).slice(0, count).join(' ');
}

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Carga fragmentos aleatorios de las transcripciones del canal de YouTube
 * para usarlos como ejemplos de estilo en los prompts.
 */
export async function loadStyleExamples(): Promise<string[]> {
  try {
    const entries = await fs.readdir(YOUTUBE_PIPELINE_OUTPUTS, { withFileTypes: true });
    const dirs = entries.filter(e => e.isDirectory()).map(e => e.name);

    if (dirs.length === 0) {
      logger.warn('styleService: no transcripciones encontradas en youtube-pipeline');
      return [];
    }

    const selected = shuffle(dirs).slice(0, NUM_EXAMPLES * 3); // oversample por si fallan lecturas
    const excerpts: string[] = [];

    for (const dir of selected) {
      if (excerpts.length >= NUM_EXAMPLES) break;
      try {
        const filePath = path.join(YOUTUBE_PIPELINE_OUTPUTS, dir, 'transcription.txt');
        const text = await fs.readFile(filePath, 'utf-8');
        const trimmed = text.trim();
        if (trimmed.length < 100) continue;
        // Tomar un fragmento desde el inicio (donde el estilo es más característico)
        excerpts.push(pickWords(trimmed, EXCERPT_WORDS));
      } catch {
        // archivo no existe, skip
      }
    }

    return excerpts;
  } catch (err) {
    logger.warn(`styleService: no se pudo leer outputs de youtube-pipeline: ${err}`);
    return [];
  }
}

/**
 * Construye el bloque de ejemplos de estilo para incluir en el system prompt.
 */
export async function buildStyleBlock(): Promise<string> {
  const examples = await loadStyleExamples();
  if (examples.length === 0) return '';

  const block = examples
    .map((ex, i) => `[Ejemplo ${i + 1}]\n"${ex}..."`)
    .join('\n\n');

  return `\n\nA continuación tienes ejemplos reales de cómo habla y se expresa el creador. Imita su tono, vocabulario y forma de construir las frases:\n\n${block}`;
}
