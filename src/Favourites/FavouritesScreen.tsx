import { router } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFavouritesViewModel } from '@/Favourites/FavouritesViewModel';
import { useForecastViewModel } from '@/Forecast/ForecastViewModel';
import { Card } from '@/Shared/Components/Card';
import { useAppTheme } from '@/Shared/Theme';
import { Place } from '@/Shared/Types';

// ---- Favourites screen (W-03) ----
// The saved places. Tap one to open it on the Weather tab, ✕ to remove it.
// No "are you sure?" when removing: it's easy to undo by starring the city again.
export function FavouritesScreen() {
  const theme = useAppTheme();
  const favourites = useFavouritesViewModel();
  const forecast = useForecastViewModel();

  // Open a favourite: load its forecast (shared), then switch to the Weather tab to show it.
  function openPlace(place: Place) {
    forecast.Process_LoadForecast(place);
    router.navigate('/');
  }

  if (!favourites.isLoaded) {
    return (
      <View style={[styles.centre, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.accent} />
      </View>
    );
  }

  return (
    <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={styles.container}>
      {favourites.favourites.length === 0 ? (
        <Card style={styles.empty}>
          <Text style={styles.emptyIcon}>☆</Text>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>No favourites yet</Text>
          <Text style={{ color: theme.textMuted, textAlign: 'center' }}>
            Tap the star next to a city on the Weather tab, and it shows up here.
          </Text>
        </Card>
      ) : (
        <Card style={styles.list}>
          {favourites.favourites.map((place, i) => (
            <View key={`${place.latitude},${place.longitude}`}
              style={[styles.row, i > 0 && { borderTopWidth: 1, borderTopColor: theme.border }]}>
              <Pressable style={styles.name} onPress={() => openPlace(place)} accessibilityRole="button"
                accessibilityLabel={`Open ${place.name}`}>
                <Text style={[styles.nameText, { color: theme.text }]}>{place.name}</Text>
              </Pressable>
              <Pressable onPress={() => favourites.Process_ToggleFavourite(place)} hitSlop={12}
                accessibilityRole="button" accessibilityLabel={`Remove ${place.name} from favourites`}>
                <Text style={[styles.remove, { color: theme.textMuted }]}>✕</Text>
              </Pressable>
            </View>
          ))}
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16 },
  centre: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', paddingVertical: 32 },
  emptyIcon: { fontSize: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '600' },
  list: { paddingVertical: 4, gap: 0 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 12 },
  name: { flex: 1 },
  nameText: { fontSize: 16, fontWeight: '600' },
  remove: { fontSize: 18, paddingHorizontal: 4 },
});
