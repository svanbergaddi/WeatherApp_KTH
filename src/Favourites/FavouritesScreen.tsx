import { router } from 'expo-router';
import { Button, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFavouritesViewModel } from '@/Favourites/FavouritesViewModel';
import { useForecastViewModel } from '@/Forecast/ForecastViewModel';
import { Place } from '@/Shared/Types';

// TEMPORARY test screen for step 3: the saved places, tap to open, ✕ to remove.
// Replaced by the designed screen in step 4 (W-03).
export function FavouritesScreen() {
  const favourites = useFavouritesViewModel();
  const forecast = useForecastViewModel();

  // Open a favourite: load its forecast (shared), then go to the home tab to show it.
  function openPlace(place: Place) {
    forecast.Process_LoadForecast(place);
    router.navigate('/');
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {!favourites.isLoaded && <Text>Loading…</Text>}
      {favourites.isLoaded && favourites.favourites.length === 0 && (
        <Text>No favourites yet. Tap ☆ next to a city on the Weather tab.</Text>
      )}
      {favourites.favourites.map((place) => (
        <View key={`${place.latitude},${place.longitude}`} style={styles.row}>
          <Button title={place.name} onPress={() => openPlace(place)} />
          <Button title="✕" onPress={() => favourites.Process_ToggleFavourite(place)} />
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
