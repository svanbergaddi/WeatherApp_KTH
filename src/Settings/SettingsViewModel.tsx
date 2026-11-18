import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { DEFAULT_SETTINGS, Parse_Settings } from '@/Settings/SettingsHelpers';
import { Storage_LoadSettings, Storage_SaveSettings } from '@/Settings/SettingsService';
import { Settings } from '@/Shared/Types';

type SettingsViewModel = {
  settings: Settings;
  Process_ChangeSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
};

// Shared with a Context, like favourites: the forecast reads the refresh rate,
// the theme reads the theme choice, and the Settings screen changes them.
const SettingsContext = createContext<SettingsViewModel | null>(null);

// ---- Main process for settings ----
export function SettingsProvider({ children }: { children: ReactNode }) {
  // Start with the defaults, so the app works right away, even before the saved settings are read.
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  // ---- Process_Start: read the saved settings once, when the app opens ----
  useEffect(() => {
    Storage_LoadSettings().then((saved) => {
      setSettings(Parse_Settings(saved));
      setIsLoaded(true);
    });
  }, []); // [] = run once

  // ---- Process_ChangeSetting: one setting changed on the Settings screen → update, then save ----
  // `K extends keyof Settings` makes TypeScript check that the value fits the key:
  // ('refreshMinutes', 15) is fine, ('refreshMinutes', 'night') is an error before the app even runs.
  function Process_ChangeSetting<K extends keyof Settings>(key: K, value: Settings[K]): void {
    // Before the saved settings are loaded, saving would overwrite them with the defaults.
    if (!isLoaded) return;

    const updated: Settings = { ...settings, [key]: value };
    setSettings(updated);
    Storage_SaveSettings(updated);
  }

  const viewModel: SettingsViewModel = { settings, Process_ChangeSetting };
  return <SettingsContext.Provider value={viewModel}>{children}</SettingsContext.Provider>;
}

// Screens (and other ViewModels) call this to get the shared settings.
export function useSettingsViewModel(): SettingsViewModel {
  const viewModel = useContext(SettingsContext);
  if (viewModel === null) throw new Error('useSettingsViewModel must be used inside SettingsProvider');
  return viewModel;
}
