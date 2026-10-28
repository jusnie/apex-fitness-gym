import type { ActiveWorkout, Profile, Unit } from './storage';
import { uid } from './storage';

export type TemplateKey = 'full' | 'upper' | 'lower' | 'push' | 'pull' | 'home';

type Template = {
  title: string;
  label: string;
  description: string;
  exercises: Array<[string, string, number]>;
};

export const templates: Record<TemplateKey, Template> = {
  full: {
    title: 'Full Body Foundation',
    label: 'APEX FOUNDATION',
    description: 'A balanced strength session for the whole body.',
    exercises: [['Goblet squat', '3 × 8–10', 18], ['Dumbbell bench press', '3 × 8–10', 16], ['Cable or band row', '3 × 10–12', 20], ['Romanian deadlift', '3 × 8–10', 30]],
  },
  upper: {
    title: 'Upper Strength',
    label: 'UPPER BODY',
    description: 'Press, pull, and build a stronger upper body.',
    exercises: [['Dumbbell bench press', '3 × 8–10', 16], ['Lat pulldown', '3 × 8–10', 28], ['Seated shoulder press', '3 × 10', 14], ['Cable row', '3 × 10–12', 24]],
  },
  lower: {
    title: 'Lower Strength',
    label: 'LOWER BODY',
    description: 'A focused lower-body session for strength and control.',
    exercises: [['Goblet squat', '3 × 8–10', 18], ['Romanian deadlift', '3 × 8–10', 30], ['Reverse lunge', '3 × 10', 12], ['Standing calf raise', '3 × 12–15', 0]],
  },
  push: {
    title: 'Push Focus',
    label: 'UPPER BODY',
    description: 'A focused chest, shoulder, and triceps session.',
    exercises: [['Dumbbell bench press', '4 × 8', 16], ['Seated shoulder press', '3 × 10', 14], ['Incline push-up', '3 × 10–12', 0], ['Triceps pressdown', '3 × 12', 16]],
  },
  pull: {
    title: 'Pull Focus',
    label: 'UPPER BODY',
    description: 'A focused back and biceps session for quality reps.',
    exercises: [['Lat pulldown', '4 × 8', 28], ['Cable row', '3 × 10', 24], ['Dumbbell curl', '3 × 12', 8], ['Face pull', '3 × 12', 12]],
  },
  home: {
    title: 'Home Strength',
    label: 'HOME TRAINING',
    description: 'A simple session adapted to limited equipment.',
    exercises: [['Tempo squat', '3 × 12', 0], ['Push-up', '3 × 8–12', 0], ['Backpack row', '3 × 12', 10], ['Hip bridge', '3 × 15', 0]],
  },
};

export function toDisplayWeight(weightKg: number, unit: Unit): number {
  return unit === 'lb' ? Math.round(weightKg * 2.20462) : Math.round(weightKg);
}

export function toKg(weight: number, unit: Unit): number {
  return unit === 'lb' ? weight / 2.20462 : weight;
}

function repTarget(target: string): number {
  const matched = target.match(/[×x]\s*(\d+)/i);
  return matched ? Number(matched[1]) : 10;
}

export function createWorkout(templateKey: TemplateKey, profile: Profile): ActiveWorkout {
  const template = templates[templateKey];
  return {
    id: uid('workout'),
    title: template.title,
    label: template.label,
    startedAt: new Date().toISOString(),
    exercises: template.exercises.map(([name, target, weightKg]) => ({
      id: uid('exercise'),
      name,
      target,
      sets: Array.from({ length: 3 }, () => ({
        id: uid('set'),
        weight: toDisplayWeight(weightKg, profile.unit),
        reps: repTarget(target),
        complete: false,
      })),
    })),
  };
}

export function plannedKeys(profile: Profile): TemplateKey[] {
  const count = Math.min(7, Math.max(2, profile.frequency));
  const locations = profile.trainingLocations?.length ? profile.trainingLocations : [profile.location];
  if (!locations.includes('gym')) return Array.from({ length: count }, () => 'home');
  if (count === 2) return ['full', 'full'];
  if (count === 3) return ['lower', 'upper', 'full'];
  if (count === 4) return ['upper', 'lower', 'push', 'pull'];
  if (count === 5) return ['upper', 'lower', 'push', 'pull', 'full'];
  return ['upper', 'lower', 'push', 'pull', 'full', 'upper', 'lower'].slice(0, count) as TemplateKey[];
}

export function recommendedKey(profile: Profile, completedToday: number): TemplateKey {
  const plan = plannedKeys(profile);
  return plan[Math.min(completedToday, plan.length - 1)] ?? 'full';
}
