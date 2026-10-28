import AsyncStorage from '@react-native-async-storage/async-storage';

export const INTRO_KEY = 'apex.workout.intro.completed.v1';
export const PROFILE_KEY = 'apex.workout.profile.v1';
export const SESSION_KEY = 'apex.workout.sessions.v1';
export const MEAL_KEY = 'apex.workout.meals.v1';

export type Unit = 'kg' | 'lb';
export type ProfileSex = 'male' | 'female';
export type TrainingLocation = 'home' | 'gym' | 'studio' | 'hybrid' | 'outdoors';
export type TrainingPlace = 'gym' | 'home' | 'outdoors';

export type Profile = {
  name: string;
  photo: string;
  unit: Unit;
  sex: ProfileSex;
  age: number;
  height: number;
  weight: number;
  frequency: number;
  location: TrainingLocation;
  trainingLocations: TrainingPlace[];
  complete: boolean;
};

export type WorkoutSet = {
  id: string;
  weight: number;
  reps: number;
  complete: boolean;
};

export type ActiveExercise = {
  id: string;
  name: string;
  target: string;
  sets: WorkoutSet[];
};

export type ActiveWorkout = {
  id: string;
  title: string;
  label: string;
  startedAt: string;
  exercises: ActiveExercise[];
};

export type WorkoutSession = {
  id: string;
  title: string;
  finishedAt: string;
  completedSets: number;
  volumeKg: number;
};

export type Meal = {
  id: string;
  name: string;
  calories: number;
  day: string;
};

export const defaultProfile: Profile = {
  name: '',
  photo: '',
  unit: 'kg',
  sex: 'male',
  age: 26,
  height: 175,
  weight: 75,
  frequency: 4,
  location: 'gym',
  trainingLocations: ['gym'],
  complete: false,
};

export async function getStored<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export async function saveStored<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export async function setIntroComplete(): Promise<void> {
  await AsyncStorage.setItem(INTRO_KEY, 'true');
}

export const uid = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export function localDay(value = new Date()): string {
  const date = new Date(value);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}
