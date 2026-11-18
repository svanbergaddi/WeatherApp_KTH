import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useFavouritesViewModel } from '@/Favourites/FavouritesViewModel';
import { CurrentWeatherCard } from '@/Forecast/Components/CurrentWeatherCard';
import { DailyList } from '@/Forecast/Components/DailyList';
import { HourlyStrip } from '@/Forecast/Components/HourlyStrip';
import { useForecastViewModel } from '@/Forecast/ForecastViewModel';
import { SearchBox } from '@/Search/Components/SearchBox';
import { useSearchViewModel } from '@/Search/SearchViewModel';
import { StatusBanner } from '@/Shared/Components/StatusBanner';
import { Format_LastUpdated } from '@/Shared/FormatHelpers';
import { useAppTheme } from '@/Shared/Theme';

// ---- Home screen (W-01) ----
// The View in MVVM: it only places things on screen. All state and decisions are in the ViewModels.
// Every state has its own look (W-19): empty, loading, offline with saved data, error, ready.
export function SearchScreen() {
  const theme = useAppTheme();
  const forecast = useForecastViewModel();
  const favourites = useFavouritesViewModel();
  // Picking a place in Search loads its forecast: the two ViewModels are connected here.
  const search = useSearchViewModel(forecast.Process_LoadForecast);

  // Landscape (W-10): the screen is wider than tall, so put the "now" card and the lists side by side.
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const { place, view, status } = forecast;
  const data = forecast.forecast;
  const hasData = place !== null && data !== null && view !== null;
  const isRefreshing = status === 'loading' && hasData; // reloading while old data is still shown

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      // Pull down to refresh. The network call runs in the background, so the screen never freezes (W-14).
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={forecast.Process_Refresh} tintColor={theme.accent} />}
    >
      <SearchBox search={search} />

      {/* Empty: first start, nothing picked yet. */}
      {status === 'empty' && (
        <Text style={[styles.hint, { color: theme.textMuted }]}>Search for a place, or pick one of the cities above.</Text>
      )}

      {/* Loading for the first time: nothing to show yet. */}
      {status === 'loading' && !hasData && (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={theme.accent} />
          <Text style={{ color: theme.textMuted }}>Getting the weather for {place?.name}…</Text>
        </View>
      )}

      {/* Error with nothing to show: say what happened and offer to try again. Never a blank screen (W-15). */}
      {status === 'error' && forecast.message !== null && (
        <StatusBanner tone="error" message={forecast.message} detail={place?.name}
          actionLabel="Try again" onAction={forecast.Process_Refresh} />
      )}

      {/* Offline (or server trouble) but we have saved data: show it, and say how old it is (W-09). */}
      {hasData && forecast.message !== null && (
        <StatusBanner tone="warning" message={forecast.message}
          detail={forecast.savedAt !== null ? `Showing saved data. ${Format_LastUpdated(forecast.savedAt)}` : undefined}
          actionLabel="Try again" onAction={forecast.Process_Refresh} />
      )}

      {/* Checked again here (not with hasData) so TypeScript knows none of them is null inside. */}
      {place !== null && data !== null && view !== null && (
        <View style={isLandscape ? styles.columns : styles.stack}>
          <View style={isLandscape ? styles.column : undefined}>
            <CurrentWeatherCard
              place={place}
              forecast={data}
              view={view}
              isFavourite={favourites.Process_IsFavourite(place)}
              onToggleFavourite={() => favourites.Process_ToggleFavourite(place)}
            />
          </View>
          <View style={[styles.stack, isLandscape && styles.column]}>
            <HourlyStrip hours={view.hoursLeftToday} />
            <DailyList days={view.week} todayDate={view.today.date} />
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16, paddingBottom: 32 },
  hint: { textAlign: 'center', marginTop: 24 },
  loading: { alignItems: 'center', gap: 12, marginTop: 32 },
  stack: { gap: 16 },
  columns: { flexDirection: 'row', gap: 16, alignItems: 'flex-start' },
  column: { flex: 1 },
});
