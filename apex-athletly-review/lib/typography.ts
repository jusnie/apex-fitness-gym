export const Typography = {
  display: { fontSize: 32, fontWeight: '700' as const, lineHeight: 38, letterSpacing: -0.5 },
  h1: { fontSize: 26, fontWeight: '700' as const, lineHeight: 32, letterSpacing: -0.3 },
  h2: { fontSize: 20, fontWeight: '600' as const, lineHeight: 26 },
  h3: { fontSize: 17, fontWeight: '600' as const, lineHeight: 22 },
  body: { fontSize: 15, fontWeight: '400' as const, lineHeight: 22 },
  bodyMedium: { fontSize: 15, fontWeight: '500' as const, lineHeight: 22 },
  bodySm: { fontSize: 13, fontWeight: '400' as const, lineHeight: 18 },
  caption: { fontSize: 11, fontWeight: '500' as const, lineHeight: 15, letterSpacing: 0.3 },
  captionUpper: { fontSize: 11, fontWeight: '700' as const, lineHeight: 15, letterSpacing: 0.8 },
  metric: { fontSize: 36, fontWeight: '700' as const, lineHeight: 42, letterSpacing: -0.5 },
  metricSm: { fontSize: 24, fontWeight: '700' as const, lineHeight: 30, letterSpacing: -0.3 },
} as const;
