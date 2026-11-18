import { Button, ScrollView, StyleSheet, Text } from 'react-native';
import { REFRESH_CHOICES, THEME_CHOICES } from '@/Settings/SettingsHelpers';
import { useSettingsViewModel } from '@/Settings/SettingsViewModel';
import { Settings } from '@/Shared/Types';

// TEMPORARY test screen for step 3: pick each setting, the chosen one has a ✓.
// Replaced by the designed screen in step 4 (W-04, W-29).
const REFRESH_LABELS: Record<Settings['refreshMinutes'], string> = { 0: 'Never', 15: '15 min', 30: '30 min', 60: '1 hour' };
const THEME_LABELS: Record<Settings['themeChoice'], string> = {
  auto: 'Auto (Nordic night after sunset)',
  light: 'Always light',
  night: 'Always night',
};

export function SettingsScreen() {
  const { settings, Process_ChangeSetting } = useSettingsViewModel();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Update the forecast</Text>
      {REFRESH_CHOICES.map((minutes) => (
        <Button
          key={minutes}
          title={`${settings.refreshMinutes === minutes ? '✓ ' : ''}${REFRESH_LABELS[minutes]}`}
          onPress={() => Process_ChangeSetting('refreshMinutes', minutes)}
        />
      ))}

      <Text style={styles.heading}>Theme</Text>
      {THEME_CHOICES.map((choice) => (
        <Button
          key={choice}
          title={`${settings.themeChoice === choice ? '✓ ' : ''}${THEME_LABELS[choice]}`}
          onPress={() => Process_ChangeSetting('themeChoice', choice)}
        />
      ))}
      <Text>(The theme itself is built later, in the Theme section.)</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 8 },
  heading: { fontSize: 18, fontWeight: '600', marginTop: 12 },
});
