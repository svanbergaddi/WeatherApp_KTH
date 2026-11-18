import { createContext, useContext } from 'react';
import { Season } from '@/Theme/ThemeHelpers';

// Every colour in the app comes from here (STYLE.md). Screens never write a colour themselves,
// so switching theme only means handing the screens a different palette.
export type AppTheme = {
  name: Season | 'night'; // which palette this is (the animated scenes, W-30, pick their picture from it)
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

// The parts every light theme shares; each season then sets its own background, border and accent.
const LIGHT_BASE = { isNight: false, card: '#FFFFFF', text: '#1B2430', textMuted: '#5B6573', danger: '#C0392B' };

// ---- Seasonal light themes (W-28) ----
export const SEASON_THEMES: Record<Season, AppTheme> = {
  // Snow and pale ice blue.
  winter: { ...LIGHT_BASE, name: 'winter', background: '#EEF3F8', border: '#D6E0EA', accent: '#2F6FB3', warning: '#B8620F' },
  // Fresh birch-leaf green.
  spring: { ...LIGHT_BASE, name: 'spring', background: '#F1F6EE', border: '#D9E6D3', accent: '#3A8452', warning: '#B8620F' },
  // Warm light, sea blue.
  summer: { ...LIGHT_BASE, name: 'summer', background: '#FFF8EA', border: '#F0E3C4', accent: '#1F7A99', warning: '#B8620F' },
  // Rust and fallen leaves.
  autumn: { ...LIGHT_BASE, name: 'autumn', background: '#F7EFE6', border: '#E8DACA', accent: '#A9532A', warning: '#A35A0B' },
};

// ---- Nordic night (W-27): deep blue, with an aurora-green accent ----
export const NIGHT_THEME: AppTheme = {
  name: 'night',
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

// ---- useAppTheme: the palette to use right now ----
// ThemeProvider (src/Theme/ThemeViewModel.tsx) decides which palette that is and puts it in this Context.
// Screens only call useAppTheme(): they never know WHY it's night or winter.
// The default (outside a provider, e.g. in a test) is the winter palette.
export const ThemeContext = createContext<AppTheme>(SEASON_THEMES.winter);

export function useAppTheme(): AppTheme {
  return useContext(ThemeContext);
}

// ---- Illustration colours for the animated scenes (W-30) ----
// Also here and not in the scene files, so every colour in the app is in one place (STYLE.md).
export const SCENE_COLOURS = {
  night: {
    skyTop: '#050B18', skyBottom: '#1B2D52', star: '#E6EDF7', moon: '#F2E8C9',
    auroraGreen: '#4FD1A5', auroraViolet: '#8B7CF6', mountain: '#0A1222',
  },
  winter: {
    skyTop: '#B7D0E8', skyBottom: '#EEF3F8', hillBack: '#D6E4F1', hillFront: '#FFFFFF', pine: '#2E5A4C', snow: '#FFFFFF',
  },
  spring: {
    skyTop: '#BFE2F5', skyBottom: '#EAF5E6', sun: '#FFD66B', meadowBack: '#A9D493', meadowFront: '#7DB86A',
    birchTrunk: '#F4F1EA', birchMark: '#2A2A2A', crown: '#8CC56E', leaf: '#6FAE52',
  },
  summer: {
    skyTop: '#9ED6F0', skyBottom: '#FFF4D6', sun: '#FFC93C', sea: '#1F7A99', wave: '#7CC3DB',
    island: '#5C7A4A', rock: '#8A8478', sail: '#FFFFFF', hull: '#A9532A',
  },
  autumn: {
    skyTop: '#F2C9A0', skyBottom: '#F7EFE6', hillBack: '#D9A47A', hillFront: '#B8743F', trunk: '#5A3A26',
    leafRed: '#C8552B', leafOrange: '#E39B2E', leafBrown: '#9C3D22',
  },
};
