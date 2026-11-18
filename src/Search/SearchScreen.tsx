import { Link } from 'expo-router';
import { useState } from 'react';
import { Button, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useForecastViewModel } from '@/Forecast/ForecastViewModel';
import { QUICK_PICK_CITIES } from '@/Search/QuickPickCities';
import { useSearchViewModel } from '@/Search/SearchViewModel';

// TEMPORARY test screen for step 3: plain controls that drive the two ViewModels.
// Replaced by the real, designed home screen in step 4 (W-01, W-19, W-21, W-22).
export function SearchScreen() {
  const forecast = useForecastViewModel();
  // Picking a place in Search loads its forecast: the two ViewModels are connected here, in the screen.
  const search = useSearchViewModel(forecast.Process_LoadForecast);
  const [latitudeText, setLatitudeText] = useState('');
  const [longitudeText, setLongitudeText] = useState('');
  const [showCoordinates, setShowCoordinates] = useState(false);
  const { view } = forecast;

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.heading}>Search</Text>
      <TextInput
        style={styles.input}
        placeholder="City name"
        value={search.query}
        onChangeText={search.Process_TypeQuery}
        onSubmitEditing={search.Process_SubmitQuery}
        returnKeyType="search"
        autoCorrect={false}
      />
      {search.isSearching && <Text>Searching…</Text>}
      {search.message !== null && <Text>Search message: {search.message}</Text>}
      {search.suggestions.map((place) => (
        <Button key={`${place.latitude},${place.longitude}`} title={place.name} onPress={() => search.Process_SelectPlace(place)} />
      ))}

      <Text style={styles.heading}>Quick picks</Text>
      <View style={styles.row}>
        {QUICK_PICK_CITIES.map((place) => (
          <Button key={place.name} title={place.name} onPress={() => search.Process_SelectPlace(place)} />
        ))}
      </View>

      {/* Coordinates are hidden until asked for: city search is the main way in (W-13 still works). */}
      <Text style={styles.link} onPress={() => setShowCoordinates(!showCoordinates)}>
        {showCoordinates ? 'Hide coordinates' : 'Use coordinates instead'}
      </Text>
      {showCoordinates && (
        <>
          <View style={styles.row}>
            <TextInput style={styles.input} placeholder="Latitude" value={latitudeText} onChangeText={setLatitudeText} />
            <TextInput style={styles.input} placeholder="Longitude" value={longitudeText} onChangeText={setLongitudeText} />
          </View>
          <Button title="Go" onPress={() => search.Process_SearchCoordinates(latitudeText, longitudeText)} />
        </>
      )}

      <Text style={styles.heading}>Forecast</Text>
      <Button title="Refresh" onPress={forecast.Process_Refresh} />
      <Text>Status: {forecast.status}</Text>
      <Text>Place: {forecast.place?.name ?? '-'}</Text>
      {forecast.message !== null && <Text>Message: {forecast.message}</Text>}
      {forecast.savedAt !== null && <Text>Cached from: {forecast.savedAt}</Text>}
      {view !== null && forecast.forecast !== null && (
        <>
          <Text>Now: {forecast.forecast.current.temperatureC} °C (feels {forecast.forecast.current.feelsLikeC} °C)</Text>
          <Text>Gusts now: {forecast.forecast.current.windGustsMs} m/s → warning: {view.windWarningNow}</Text>
          <Text>Wear today: {JSON.stringify(view.outfitToday)}</Text>
          <Text>Daylight: {view.daylightChangeMinutes} min since yesterday</Text>
          <Text>Days: {view.week.length} · Hours today: {view.todayHours.length}</Text>
        </>
      )}

      <Link href="/day/2026-11-17">Open a test day →</Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 8 },
  heading: { fontSize: 18, fontWeight: '600', marginTop: 12 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  link: { color: '#2a6fdb', marginTop: 12 },
  input: { borderWidth: 1, borderColor: '#999', borderRadius: 6, padding: 8, minWidth: 140 },
});
