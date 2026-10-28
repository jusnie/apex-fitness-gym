export const SportColors: Record<string, string> = {
  running: '#3B82F6',   // blue
  cycling: '#A855F7',   // purple
  swimming: '#06B6D4',  // cyan
  gym: '#F59E0B',       // amber
  strength: '#F59E0B',  // amber (alias)
  yoga: '#EC4899',      // pink
  hiking: '#22C55E',    // green
  rest: '#94A3B8',      // light slate gray
  default: '#3B82F6',   // blue fallback
};

export function getSportColor(sport: string): string {
  return SportColors[sport.toLowerCase()] || SportColors.default;
}

export const SportIcons: Record<string, string> = {
  running: 'footprints',
  cycling: 'bike',
  swimming: 'waves',
  gym: 'dumbbell',
  strength: 'dumbbell',
  yoga: 'heart',
  hiking: 'mountain',
  rest: 'moon',
  default: 'activity',
};

export function getSportIcon(sport: string): string {
  return SportIcons[sport.toLowerCase()] || SportIcons.default;
}
