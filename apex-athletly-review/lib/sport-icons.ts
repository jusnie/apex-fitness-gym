/**
 * Sport Icons — maps sport names to lucide-react-native icon components.
 *
 * Supports English and German sport names.
 */

import {
  Footprints,
  Bike,
  Waves,
  Dumbbell,
  Flower2,
  Mountain,
  Activity,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';

const SPORT_ICON_MAP: Record<string, LucideIcon> = {
  running: Footprints,
  laufen: Footprints,
  cycling: Bike,
  radfahren: Bike,
  swimming: Waves,
  schwimmen: Waves,
  strength: Dumbbell,
  kraft: Dumbbell,
  gym: Dumbbell,
  yoga: Flower2,
  flexibility: Flower2,
  hiking: Mountain,
  wandern: Mountain,
};

export function getSportIcon(sport: string): LucideIcon {
  return SPORT_ICON_MAP[sport.toLowerCase()] ?? Activity;
}
