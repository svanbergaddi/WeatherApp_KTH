import { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { REFRESH_CHOICES, THEME_CHOICES } from '@/Settings/SettingsHelpers';
import { useSettingsViewModel } from '@/Settings/SettingsViewModel';
import { Card } from '@/Shared/Components/Card';
import { AppTheme, useAppTheme } from '@/Shared/Theme';
import { Settings } from '@/Shared/Types';
import { SceneBanner } from '@/Theme/Scenes/SceneBanner';

// The scenes you can preview (W-30), in the order shown.
const PREVIEW_SCENES: { name: AppTheme['name']; label: string }[] = [
  { name: 'night', label: '🌌 Night' },
  { name: 'winter', label: '❄️ Winter' },
  { name: 'spring', label: '🌱 Spring' },
  { name: 'summer', label: '☀️ Summer' },
  { name: 'autumn', label: '🍂 Autumn' },
];

const REFRESH_LABELS: Record<Settings['refreshMinutes'], string> = { 0: 'Never', 15: 'Every 15 minutes', 30: 'Every 30 minutes', 60: 'Every hour' };
const THEME_LABELS: Record<Settings['themeChoice'], { title: string; detail: string }> = {
  auto: { title: 'Auto', detail: 'Nordic night from 30 min after sunset until sunrise' },
  light: { title: 'Always light', detail: 'Seasonal colours all day' },
  night: { title: 'Always night', detail: 'The dark Nordic night theme all the time' },
};

// ---- Settings screen (W-04, W-29) ----
// Two lists of choices (the chosen one has a ✓), and an About card that credits the data sources.
export function SettingsScreen() {
  const theme = useAppTheme();
  const { settings, Process_ChangeSetting } = useSettingsViewModel();
  // Which scene the preview shows. Only on this screen and never saved: it doesn't change the app's theme.
  const [previewScene, setPreviewScene] = useState<AppTheme['name']>(theme.name);

  // One choice in a list. accessibilityState tells screen readers which one is selected.
  function option(key: string, title: string, isSelected: boolean, onPress: () => void, detail?: string, isFirst?: boolean) {
    return (
      <Pressable key={key} onPress={onPress} accessibilityRole="radio" accessibilityState={{ selected: isSelected }}
        style={[styles.option, !isFirst && { borderTopWidth: 1, borderTopColor: theme.border }]}>
        <View style={styles.optionTexts}>
          <Text style={[styles.optionTitle, { color: theme.text }]}>{title}</Text>
          {detail !== undefined && <Text style={{ color: theme.textMuted, fontSize: 13 }}>{detail}</Text>}
        </View>
        <Text style={[styles.check, { color: theme.accent }]}>{isSelected ? '✓' : ''}</Text>
      </Pressable>
    );
  }

  return (
    <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={styles.container}>
      <Text style={[styles.section, { color: theme.textMuted }]}>UPDATE THE FORECAST</Text>
      <Card style={styles.list}>
        {REFRESH_CHOICES.map((minutes, i) => option(
          `refresh-${minutes}`, REFRESH_LABELS[minutes], settings.refreshMinutes === minutes,
          () => Process_ChangeSetting('refreshMinutes', minutes), undefined, i === 0,
        ))}
      </Card>

      <Text style={[styles.section, { color: theme.textMuted }]}>THEME</Text>
      <Card style={styles.list}>
        {THEME_CHOICES.map((choice, i) => option(
          `theme-${choice}`, THEME_LABELS[choice].title, settings.themeChoice === choice,
          () => Process_ChangeSetting('themeChoice', choice), THEME_LABELS[choice].detail, i === 0,
        ))}
      </Card>

      {/* Every scene can be seen here, not only the one for today's season and time (handy for a demo). */}
      <Text style={[styles.section, { color: theme.textMuted }]}>SCENE PREVIEW</Text>
      <Card>
        <View style={styles.chips}>
          {PREVIEW_SCENES.map((scene) => {
            const isSelected = previewScene === scene.name;
            return (
              <Pressable key={scene.name} onPress={() => setPreviewScene(scene.name)}
                accessibilityRole="button" accessibilityState={{ selected: isSelected }}
                style={[styles.chip, { borderColor: isSelected ? theme.accent : theme.border, backgroundColor: theme.card }]}>
                <Text style={{ color: isSelected ? theme.accent : theme.text, fontWeight: isSelected ? '600' : '400' }}>{scene.label}</Text>
              </Pressable>
            );
          })}
        </View>
        <SceneBanner sceneName={previewScene} />
        <Text style={{ color: theme.textMuted, fontSize: 13 }}>
          Only a preview: the app picks its scene from the time of day and the season.
        </Text>
      </Card>

      {/* Both data sources require credit in the app (Open-Meteo: CC BY 4.0, OpenStreetMap: ODbL). */}
      <Text style={[styles.section, { color: theme.textMuted }]}>ABOUT</Text>
      <Card>
        <Text style={{ color: theme.text }}>
          Weather data by{' '}
          <Text style={{ color: theme.accent }} onPress={() => Linking.openURL('https://open-meteo.com/')}>Open-Meteo.com</Text>
          {' '}(CC BY 4.0)
        </Text>
        <Text style={{ color: theme.text }}>
          Place search by geocode.maps.co, map data ©{' '}
          <Text style={{ color: theme.accent }} onPress={() => Linking.openURL('https://www.openstreetmap.org/copyright')}>
            OpenStreetMap contributors
          </Text>
        </Text>
        <Text style={{ color: theme.textMuted, fontSize: 13 }}>CM2023 Lab B:2, KTH</Text>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 8, paddingBottom: 32 },
  section: { fontSize: 12, fontWeight: '600', letterSpacing: 0.5, marginTop: 12, marginLeft: 4 },
  list: { paddingVertical: 0, gap: 0 },
  option: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 12 },
  optionTexts: { flex: 1, gap: 2 },
  optionTitle: { fontSize: 16 },
  check: { fontSize: 18, fontWeight: '700', width: 20, textAlign: 'right' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1.5, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
});
