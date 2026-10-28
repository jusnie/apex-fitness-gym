#!/usr/bin/env node
/**
 * Bake the exercise demo-video index for APEX Workout.
 *
 * The hosted Free Exercise API (https://free-exercise-db-api.vercel.app) caps each
 * IP at 4 requests total and then answers 429 { error.code: "DEMO_LIMIT" }. The app
 * is local-first, so we never call the API from the client: this script fetches the
 * catalogue once and writes a slim, offline index that both apps bundle.
 *
 * Usage:
 *   node scripts/sync-exercise-videos.mjs
 *   node scripts/sync-exercise-videos.mjs --base https://my-instance.example.com
 *   node scripts/sync-exercise-videos.mjs --from-file ./exercises.json
 *   node scripts/sync-exercise-videos.mjs --check
 *
 * Outputs:
 *   apex-healthai/video-index.json
 *   apex-workout-native/src/data/exercise-videos.json
 */

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUTPUTS = [
  path.join(ROOT, 'apex-healthai', 'video-index.json'),
  path.join(ROOT, 'apex-workout-native', 'src', 'data', 'exercise-videos.json'),
];
const DEFAULT_BASE = 'https://free-exercise-db-api.vercel.app';

function parseArgs(argv) {
  const args = { base: DEFAULT_BASE, fromFile: null, check: false, pageSize: 500 };
  for (let i = 0; i < argv.length; i += 1) {
    const flag = argv[i];
    if (flag === '--check') args.check = true;
    else if (flag === '--base') args.base = argv[++i];
    else if (flag === '--from-file') args.fromFile = argv[++i];
    else if (flag === '--page-size') args.pageSize = Number(argv[++i]);
    else if (flag === '--help' || flag === '-h') args.help = true;
    else throw new Error(`Unknown argument: ${flag}`);
  }
  return args;
}

async function fetchJson(url, attempt = 1) {
  let response;
  try {
    response = await fetch(url, { headers: { accept: 'application/json' } });
  } catch (error) {
    if (attempt < 3) {
      await new Promise((resolve) => setTimeout(resolve, 400 * attempt));
      return fetchJson(url, attempt + 1);
    }
    throw new Error(`Network error for ${url}: ${error.message}`);
  }
  if (response.status === 429) {
    const body = await response.text().catch(() => '');
    throw new Error(
      `Rate limited (429) by ${url}. The hosted demo allows 4 requests per IP.\n` +
        `Self-host the API (DEMO_MODE=false) and rerun with --base, or rerun later.\n${body}`.trim(),
    );
  }
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
  return response.json();
}

/** Pull every exercise, following limit/offset pagination. */
async function fetchCatalog(base, pageSize) {
  const collected = [];
  for (let offset = 0; ; offset += pageSize) {
    const url = `${base.replace(/\/$/, '')}/api/v1/exercises?limit=${pageSize}&offset=${offset}`;
    const payload = await fetchJson(url);
    const page = payload?.data ?? [];
    collected.push(...page);
    const total = Number(payload?.count ?? collected.length);
    if (page.length < pageSize || collected.length >= total) break;
  }
  return collected;
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/** Only keep fields the UI needs; keeps both JSON files small (~100 KB). */
function toEntry(exercise) {
  const videos = exercise.videos ?? {};
  const thumbnails = exercise.thumbnails ?? {};
  const name = String(exercise.name ?? '').trim();
  if (!name) return null;
  const hasVideo = Boolean(videos.male || videos.female);
  if (!hasVideo) return null;
  return {
    id: String(exercise.id ?? slugify(name)),
    name,
    aliases: (exercise.aliases ?? []).map((alias) => String(alias).trim()).filter(Boolean).slice(0, 8),
    bodyPart: exercise.bodyPart ?? null,
    target: exercise.target ?? null,
    equipment: exercise.equipment ?? null,
    difficulty: exercise.difficulty ?? null,
    videos: {
      male: videos.male ?? null,
      female: videos.female ?? null,
    },
    thumbnails: {
      male: thumbnails.male ?? null,
      female: thumbnails.female ?? null,
    },
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(
      'Usage: node scripts/sync-exercise-videos.mjs [--base URL] [--from-file JSON] [--check]',
    );
    return;
  }

  const raw = args.fromFile
    ? JSON.parse(await readFile(path.resolve(args.fromFile), 'utf8'))
    : await fetchCatalog(args.base, args.pageSize);

  const list = Array.isArray(raw) ? raw : (raw?.data ?? raw?.exercises ?? []);
  const byId = new Map();
  for (const exercise of list) {
    const entry = toEntry(exercise);
    if (entry && !byId.has(entry.id)) byId.set(entry.id, entry);
  }

  const exercises = [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
  if (exercises.length === 0) throw new Error('No exercises with videos found in the source.');

  const withMale = exercises.filter((item) => item.videos.male).length;
  const withFemale = exercises.filter((item) => item.videos.female).length;
  const index = {
    generatedAt: new Date().toISOString(),
    source: args.fromFile ? path.relative(ROOT, path.resolve(args.fromFile)) : args.base,
    license: 'Free Exercise DB — MIT',
    count: exercises.length,
    exercises,
  };
  const json = `${JSON.stringify(index)}\n`;

  if (args.check) {
    for (const target of OUTPUTS) {
      try {
        const current = await readFile(target, 'utf8');
        const stale = JSON.stringify(JSON.parse(current).exercises) !== JSON.stringify(exercises);
        console.log(`${stale ? 'STALE' : 'OK   '} ${path.relative(ROOT, target)}`);
      } catch {
        console.log(`MISSING ${path.relative(ROOT, target)}`);
      }
    }
    return;
  }

  for (const target of OUTPUTS) await writeFile(target, json, 'utf8');
  console.log(
    `Wrote ${exercises.length} exercises (${withMale} male demos, ${withFemale} female demos) ` +
      `to ${OUTPUTS.map((target) => path.relative(ROOT, target)).join(' and ')}`,
  );
}

main().catch((error) => {
  console.error(`\n${error.message}\n`);
  process.exitCode = 1;
});
