import { Settings } from '@/Shared/Types';

// What a new user gets: refresh every 30 minutes, theme follows the sun.
export const DEFAULT_SETTINGS: Settings = { refreshMinutes: 30, themeChoice: 'auto' };

export const REFRESH_CHOICES: Settings['refreshMinutes'][] = [0, 15, 30, 60];
export const THEME_CHOICES: Settings['themeChoice'][] = ['auto', 'light', 'night'];

// ---- Parse_Settings (W-04) ----
// Turns what was saved on the phone into valid Settings.
// Each field is checked on its own: a missing or broken field gets its default, the rest is kept.
// This also covers an older app version that saved fewer fields, or nothing saved at all (null).
export function Parse_Settings(saved: unknown): Settings {
  const fields = typeof saved === 'object' && saved !== null ? (saved as Record<string, unknown>) : {};

  const refreshMinutes = REFRESH_CHOICES.find((choice) => choice === fields.refreshMinutes);
  const themeChoice = THEME_CHOICES.find((choice) => choice === fields.themeChoice);

  return {
    refreshMinutes: refreshMinutes ?? DEFAULT_SETTINGS.refreshMinutes,
    themeChoice: themeChoice ?? DEFAULT_SETTINGS.themeChoice,
  };
}
