import { useSettingsViewModel } from '@/Settings/SettingsViewModel';

// Every colour in the app comes from here (STYLE.md). Screens never write a colour themselves,
// so switching theme only means handing the screens a different palette.
export type AppTheme = {
  isNight: boolean; // for the status bar (light icons on a dark background)
  background: string; // the screen behind everything
  card: string; // boxes on top of the background
  text: string;
  textMuted: string; // less important text: labels, "feels like"
  border: string;
  accent: string; // buttons, links, the selected tab
  warning: string; // strong gusts
  danger: string; // storm, errors
};

// Light theme. The seasonal versions (W-28) are added in the Theme section; this is the base.
export const LIGHT_THEME: AppTheme = {
  isNight: false,
  background: '#F4F1EC',
  card: '#FFFFFF',
  text: '#1B2430',
  textMuted: '#5B6573',
  border: '#E2DDD5',
  accent: '#2A6FDB',
  warning: '#C46A12',
  danger: '#C0392B',
};

// Nordic night (W-27): deep blue, with an aurora-green accent.
export const NIGHT_THEME: AppTheme = {
  isNight: true,
  background: '#0B1426',
  card: '#14213D',
  text: '#E6EDF7',
  textMuted: '#9AA8BF',
  border: '#22314F',
  accent: '#4FD1A5',
  warning: '#F2B84B',
  danger: '#FF6B6B',
};

// ---- useAppTheme: which palette to use right now ----
// "Always light" / "Always night" (W-29) work now. "Auto" uses light until the Theme section
// adds the sunset rule (W-27): then only this function changes, not the screens.
export function useAppTheme(): AppTheme {
  const { themeChoice } = useSettingsViewModel().settings;
  return themeChoice === 'night' ? NIGHT_THEME : LIGHT_THEME;
}
