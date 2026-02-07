/**
 * Shared theme tokens for consistent styling across components.
 * Use these with Tailwind arbitrary values or extend tailwind.config if needed.
 */
export const THEME = {
  accent: {
    primary: 'emerald',
    hero: 'emerald',
    villain: 'rose',
  },
  colors: {
    accent: 'rgb(16, 185, 129)',       // emerald-500
    accentDark: 'rgb(5, 150, 105)',   // emerald-600
    villain: 'rgb(244, 63, 94)',      // rose-500
    surface: 'rgb(248, 250, 252)',    // slate-50
    surfaceDark: 'rgb(15, 23, 42)',   // slate-900
  },
} as const;
