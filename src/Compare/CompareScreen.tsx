import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Format_ComparisonSentences } from '@/Compare/CompareHelpers';
import { Side, useCompareViewModel } from '@/Compare/CompareViewModel';
import { SearchBox } from '@/Search/Components/SearchBox';
import { useSearchViewModel } from '@/Search/SearchViewModel';
import { Card } from '@/Shared/Components/Card';
import { Format_Duration, Format_Temperature, Format_Weather } from '@/Shared/FormatHelpers';
import { useAppTheme } from '@/Shared/Theme';
import { Forecast } from '@/Shared/Types';

// One row of the table: its label, and how to get the value text from a city's forecast.
const ROWS: { label: string; value: (forecast: Forecast) => string }[] = [
  { label: 'Weather', value: (f) => { const w = Format_Weather(f.current.weatherCode, f.current.isDay); return `${w.icon} ${w.label}`; } },
  { label: 'Now', value: (f) => Format_Temperature(f.current.temperatureC) },
  { label: 'Feels like', value: (f) => Format_Temperature(f.current.feelsLikeC) },
  { label: 'Gusts', value: (f) => `${Math.round(f.current.windGustsMs)} m/s` },
  { label: 'Rain today', value: (f) => `${f.daily[1].precipitationMm.toFixed(1)} mm` },
  { label: 'Daylight', value: (f) => Format_Duration(f.daily[1].daylightSeconds) },
];

// ---- Compare screen (W-25) ----
// Two cities side by side: the names on top (tap one to choose which side the next city goes into),
// then a table with each label once and both values next to each other, then plain-language differences.
export function CompareScreen() {
  const theme = useAppTheme();
  const compare = useCompareViewModel();
  // Same search as on home, but a picked city goes into the active side.
  const search = useSearchViewModel(compare.Process_PickCity);
  const { left, right } = compare.slots;

  // The city name at the top of a column. The active one (where the next city goes) is outlined.
  function header(side: Side) {
    const slot = compare.slots[side];
    const isActive = compare.activeSide === side;
    return (
      <Pressable
        onPress={() => compare.Process_ChooseSide(side)}
        style={[styles.header, { borderColor: isActive ? theme.accent : theme.border, backgroundColor: theme.card }]}
        accessibilityRole="button"
        accessibilityState={{ selected: isActive }}
        accessibilityLabel={`${side} city: ${slot.place?.name ?? 'none'}. Tap to change.`}
      >
        <Text style={[styles.headerText, { color: slot.place !== null ? theme.text : theme.textMuted }]} numberOfLines={2}>
          {slot.place?.name ?? 'Pick a city'}
        </Text>
        {slot.status === 'loading' && <ActivityIndicator color={theme.accent} />}
        {slot.status === 'error' && <Text style={{ color: theme.danger, fontSize: 12 }}>{slot.message}</Text>}
      </Pressable>
    );
  }

  const bothReady = left.forecast !== null && right.forecast !== null;

  return (
    <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      {/* Search at the TOP: its suggestions open under the field, above the keyboard. At the bottom the keyboard hid them. */}
      <Text style={[styles.pickTitle, { color: theme.textMuted }]}>
        Choose the {compare.activeSide} city (tap a city name below to switch side)
      </Text>
      <SearchBox search={search} placeholder={`City for the ${compare.activeSide} side`} />

      <View style={styles.headers}>
        {header('left')}
        {header('right')}
      </View>

      {/* The table: label on the left, then the two values. A value shows "–" until that city is loaded. */}
      <Card style={styles.table}>
        {ROWS.map((row, i) => (
          <View key={row.label} style={[styles.row, i > 0 && { borderTopWidth: 1, borderTopColor: theme.border }]}>
            <Text style={[styles.label, { color: theme.textMuted }]}>{row.label}</Text>
            <Text style={[styles.value, { color: theme.text }]}>{left.forecast ? row.value(left.forecast) : '–'}</Text>
            <Text style={[styles.value, { color: theme.text }]}>{right.forecast ? row.value(right.forecast) : '–'}</Text>
          </View>
        ))}
      </Card>

      {/* The differences in words, once both cities are loaded. */}
      {bothReady && compare.comparison !== null && left.place !== null && right.place !== null && (
        <Card>
          {Format_ComparisonSentences(left.place.name, right.place.name, compare.comparison).map((sentence) => (
            <Text key={sentence} style={{ color: theme.text }}>• {sentence}</Text>
          ))}
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16, paddingBottom: 32 },
  // Indented so each name sits above its value column: card padding 16 + label 80 + gap 8 = 104.
  headers: { flexDirection: 'row', gap: 8, paddingLeft: 104, paddingRight: 16 },
  header: { flex: 1, borderWidth: 2, borderRadius: 12, padding: 10, gap: 4, minHeight: 56, justifyContent: 'center' },
  headerText: { fontWeight: '600' },
  table: { paddingVertical: 4, gap: 0 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 8 },
  label: { width: 80 },
  value: { flex: 1, fontWeight: '600' },
  pickTitle: { marginBottom: -6 },
});
