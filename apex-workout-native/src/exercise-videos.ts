import type { ExerciseGuide } from './exercises';

/**
 * Offline index of exercise demo videos.
 *
 * Baked from the Free Exercise DB API by `scripts/sync-exercise-videos.mjs`.
 * The hosted API caps each IP at 4 requests total, so this app never calls it at
 * runtime: every demo URL ships with the bundle.
 */
export type VideoVariant = 'male' | 'female';

export type ExerciseVideoEntry = {
  id: string;
  name: string;
  aliases: string[];
  bodyPart: string | null;
  target: string | null;
  equipment: string | null;
  difficulty: string | null;
  videos: { male: string | null; female: string | null };
  thumbnails: { male: string | null; female: string | null };
};

type VideoIndex = {
  generatedAt: string;
  source: string;
  license: string;
  count: number;
  exercises: ExerciseVideoEntry[];
};

const index = require('./data/exercise-videos.json') as VideoIndex;

export const exerciseVideoIndex: VideoIndex = index;
export const exerciseVideos: ExerciseVideoEntry[] = index.exercises;

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const words = (value: string) => normalize(value).split(' ').filter(Boolean);

// Template movements that are deliberately generic get matched to the closest
// catalogued variation, so every logged exercise has a demo.
const nameOverrides: Record<string, string> = {
  'goblet squat': 'Dumbbell Goblet Squat',
  'dumbbell bench press': 'Dumbbell Incline Bench Press',
  'cable or band row': 'Seated Cable Row (V-Grip)',
  'romanian deadlift': 'Dumbbell Stiff Leg Deadlift',
  'lat pulldown': 'Wide Grip Cable Lat Pulldown',
  'seated shoulder press': 'Seated Dumbbell Shoulder Press',
  'cable row': 'Seated Cable Row (V-Grip)',
  'reverse lunge': 'Dumbbell Lunge',
  'standing calf raise': 'Dumbbell Standing Calf Raise',
  'triceps pressdown': 'Cable Triceps Pushdown',
  'dumbbell curl': 'Dumbbell Biceps Curl',
  'tempo squat': 'Squat',
  'push up': 'Push-Up',
  'backpack row': 'Dumbbell Bent-Over Row',
  'hip bridge': 'Glute Bridge',
  'incline push-up': 'Incline Push-Up',
  'face pull': 'Cable Rear Delt Row (with rope)',
  'accessory movement': 'Squat',
};

const byId = new Map(exerciseVideos.map((entry) => [entry.id, entry]));
const byName = new Map<string, ExerciseVideoEntry>();
exerciseVideos.forEach((entry) => {
  byName.set(normalize(entry.name), entry);
  entry.aliases.forEach((alias) => {
    const key = normalize(alias);
    if (key && !byName.has(key)) byName.set(key, entry);
  });
});

/** Look a demo up by the guide id (both catalogs share the same 317 ids). */
export function findExerciseVideoById(id: string): ExerciseVideoEntry | undefined {
  return byId.get(String(id));
}

/** Look a demo up by free-text exercise name (e.g. a template movement). */
export function findExerciseVideoByName(name: string): ExerciseVideoEntry | undefined {
  const target = normalize(name);
  if (!target) return undefined;
  const override = nameOverrides[target];
  if (override) {
    const match = byName.get(normalize(override));
    if (match) return match;
  }
  const direct = byName.get(target);
  if (direct) return direct;

  const targetWords = new Set(words(name));
  let best: ExerciseVideoEntry | undefined;
  let bestScore = 0;
  for (const entry of exerciseVideos) {
    const candidateWords = new Set(words([entry.name, ...entry.aliases].join(' ')));
    const shared = [...targetWords].filter((word) => candidateWords.has(word)).length;
    const score = shared / Math.max(targetWords.size, 1);
    if (score > bestScore) {
      bestScore = score;
      best = entry;
    }
  }
  return bestScore >= 0.75 ? best : undefined;
}

/** Resolve the demo for a bundled guide, preferring the id link. */
export function findGuideVideo(guide: ExerciseGuide): ExerciseVideoEntry | undefined {
  return findExerciseVideoById(guide.id) ?? findExerciseVideoByName(guide.name);
}

/** Pick a clip, falling back to the other variant when one is missing. */
export function pickClip(
  entry: ExerciseVideoEntry,
  preferred: VideoVariant = 'male',
): { variant: VideoVariant; url: string; poster: string | null } | null {
  const order: VideoVariant[] = preferred === 'female' ? ['female', 'male'] : ['male', 'female'];
  for (const variant of order) {
    const url = entry.videos[variant];
    if (url) return { variant, url, poster: entry.thumbnails[variant] ?? null };
  }
  return null;
}

export const exerciseVideoCount = exerciseVideos.length;
