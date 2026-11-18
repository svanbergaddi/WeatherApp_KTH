import { Button, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Side, useCompareViewModel } from '@/Compare/CompareViewModel';
import { QUICK_PICK_CITIES } from '@/Search/QuickPickCities';
import { useSearchViewModel } from '@/Search/SearchViewModel';

// TEMPORARY test screen for step 3: two cities side by side. Tap a column, then pick a city for it.
// Replaced by the designed screen in step 4 (W-25).
export function CompareScreen() {
  const compare = useCompareViewModel();
  // Same search as on home, but a picked city goes into the active side instead of the home forecast.
  const search = useSearchViewModel(compare.Process_PickCity);
  const diff = compare.comparison;

  // One column: the city's name and its values. The active column (where the next city goes) has a blue border.
  function column(side: Side) {
    const slot = compare.slots[side];
    const isActive = compare.activeSide === side;
    const now = slot.forecast?.current;
    const today = slot.forecast?.daily[1];

    return (
      <Pressable style={[styles.column, isActive && styles.activeColumn]} onPress={() => compare.Process_ChooseSide(side)}>
        <Text style={styles.cityName}>{slot.place?.name ?? 'Tap, then pick a city'}</Text>
        {slot.status === 'loading' && <Text>Loading…</Text>}
        {slot.status === 'error' && <Text>{slot.message}</Text>}
        {now !== undefined && today !== undefined && (
          <>
            <Text style={styles.big}>{now.temperatureC} °C</Text>
            <Text>Feels {now.feelsLikeC} °C</Text>
            <Text>Gusts {now.windGustsMs} m/s</Text>
            <Text>Rain today {today.precipitationMm} mm</Text>
            <Text>Daylight {Math.round(today.daylightSeconds / 60)} min</Text>
          </>
        )}
      </Pressable>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.columns}>
        {column('left')}
        {column('right')}
      </View>

      {diff !== null && (
        <View style={styles.diff}>
          <Text style={styles.heading}>Right minus left</Text>
          <Text>Temperature {diff.temperatureDiffC} °C · Feels like {diff.feelsLikeDiffC} °C</Text>
          <Text>Gusts {diff.gustsDiffMs} m/s · Rain today {diff.rainTodayDiffMm} mm</Text>
          <Text>Daylight today {diff.daylightTodayDiffMinutes} min</Text>
        </View>
      )}

      <Text style={styles.heading}>City for the {compare.activeSide} side</Text>
      <TextInput
        style={styles.input}
        placeholder="City name"
        value={search.query}
        onChangeText={search.Process_TypeQuery}
        onSubmitEditing={search.Process_SubmitQuery}
        autoCorrect={false}
      />
      {search.message !== null && <Text>{search.message}</Text>}
      {search.suggestions.map((place) => (
        <Button key={`${place.latitude},${place.longitude}`} title={place.name} onPress={() => search.Process_SelectPlace(place)} />
      ))}
      <View style={styles.row}>
        {QUICK_PICK_CITIES.map((place) => (
          <Button key={place.name} title={place.name} onPress={() => search.Process_SelectPlace(place)} />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 8 },
  columns: { flexDirection: 'row', gap: 8 }, // row = side by side
  column: { flex: 1, padding: 12, gap: 4, borderWidth: 2, borderColor: '#ccc', borderRadius: 8 }, // flex: 1 = equal widths
  activeColumn: { borderColor: '#2a6fdb' },
  cityName: { fontWeight: '600' },
  big: { fontSize: 28, fontWeight: '600' },
  diff: { gap: 4 },
  heading: { fontSize: 18, fontWeight: '600', marginTop: 12 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  input: { borderWidth: 1, borderColor: '#999', borderRadius: 6, padding: 8 },
});
