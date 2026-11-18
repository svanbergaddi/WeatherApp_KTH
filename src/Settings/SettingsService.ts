import { Storage_Load, Storage_Save } from '@/Shared/Storage';
import { Settings } from '@/Shared/Types';

const SETTINGS_KEY = 'settings';

export function Storage_SaveSettings(settings: Settings): Promise<void> {
  return Storage_Save(SETTINGS_KEY, settings);
}

// Returns whatever was saved, unchecked (unknown). Parse_Settings turns it into valid Settings.
export function Storage_LoadSettings(): Promise<unknown> {
  return Storage_Load<unknown>(SETTINGS_KEY);
}
