/**
 * Icon resolver - Athletly V2
 *
 * Maps LLM-supplied icon names to lucide-react-native icon components.
 * The backend may produce arbitrary or new icon names over time, so the
 * resolver always returns a safe fallback instead of throwing.
 */

import {
  Target,
  Calendar,
  Clock,
  Trophy,
  Footprints,
  Heart,
  Moon,
  Activity,
  MapPin,
  Mountain,
  Zap,
  Award,
  TrendingUp,
  Brain,
  Users,
  Coffee,
  Flame,
  Circle,
  Bike,
  Dumbbell,
  Waves,
  Star,
  CheckCircle2,
  AlertTriangle,
  Compass,
  Sparkles,
  type LucideIcon,
} from 'lucide-react-native';

const ICON_MAP: Readonly<Record<string, LucideIcon>> = {
  target: Target,
  calendar: Calendar,
  clock: Clock,
  trophy: Trophy,
  footprints: Footprints,
  heart: Heart,
  moon: Moon,
  activity: Activity,
  map_pin: MapPin,
  mappin: MapPin,
  location: MapPin,
  mountain: Mountain,
  zap: Zap,
  flash: Zap,
  award: Award,
  trending_up: TrendingUp,
  trendingup: TrendingUp,
  trend: TrendingUp,
  brain: Brain,
  users: Users,
  coffee: Coffee,
  flame: Flame,
  fire: Flame,
  circle: Circle,
  bike: Bike,
  cycling: Bike,
  dumbbell: Dumbbell,
  gym: Dumbbell,
  strength: Dumbbell,
  waves: Waves,
  swimming: Waves,
  star: Star,
  check: CheckCircle2,
  check_circle: CheckCircle2,
  done: CheckCircle2,
  warning: AlertTriangle,
  alert: AlertTriangle,
  compass: Compass,
  sparkles: Sparkles,
};

export function resolveIcon(name?: string): LucideIcon {
  if (!name) return Circle;
  const key = name.trim().toLowerCase().replace(/-/g, '_');
  return ICON_MAP[key] ?? Circle;
}

export type { LucideIcon };
