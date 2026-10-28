export type ExerciseGuide = {
  id: string;
  name: string;
  aliases: string[];
  bodyPart: string;
  target: string;
  secondaryMuscles: string[];
  equipment: string;
  difficulty: string;
  shortDescription: string;
  instructions: string;
  steps: string[];
  formCues: string[];
  commonMistakes: string[];
  breathing: string;
};

export const exerciseCatalog = require('./data/apex-exercise-guide-metadata.json') as ExerciseGuide[];

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const words = (value: string) => normalize(value).split(' ').filter(Boolean);

const guideOverrides: Record<string, string> = {
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
};

const guideByName = new Map(exerciseCatalog.map((guide) => [normalize(guide.name), guide]));

export function findExerciseGuide(exerciseName: string): ExerciseGuide | undefined {
  const target = normalize(exerciseName);
  const override = guideOverrides[target];
  if (override) return guideByName.get(normalize(override));

  const direct = guideByName.get(target);
  if (direct) return direct;
  const targetWords = new Set(words(exerciseName));
  let best: ExerciseGuide | undefined;
  let highScore = 0;
  for (const guide of exerciseCatalog) {
    const candidateTerms = [guide.name, ...guide.aliases].join(' ');
    const candidateWords = new Set(words(candidateTerms));
    const shared = [...targetWords].filter((word) => candidateWords.has(word)).length;
    const score = shared / Math.max(targetWords.size, 1);
    if (score > highScore) { highScore = score; best = guide; }
  }
  return highScore >= 0.75 ? best : undefined;
}

export function searchExerciseGuides(query: string, limit = 60): ExerciseGuide[] {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return exerciseCatalog.slice(0, limit);
  return exerciseCatalog.filter((guide) => normalize([guide.name, ...guide.aliases, guide.target, guide.bodyPart, guide.equipment].join(' ')).includes(normalizedQuery)).slice(0, limit);
}

export const guideLocationCounts = {
  gym: exerciseCatalog.filter((guide) => guide.equipment !== 'body weight').length,
  home: exerciseCatalog.filter((guide) => ['body weight', 'dumbbell', 'band'].includes(guide.equipment)).length,
  outdoors: exerciseCatalog.filter((guide) => ['body weight', 'weighted'].includes(guide.equipment)).length,
};
