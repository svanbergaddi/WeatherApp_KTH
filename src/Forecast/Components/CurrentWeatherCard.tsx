import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ForecastView } from '@/Forecast/ForecastViewModel';
import { Card } from '@/Shared/Components/Card';
import {
  Format_DaylightChange, Format_Outfit, Format_Temperature, Format_Time, Format_Weather, Format_WindWarning,
} from '@/Shared/FormatHelpers';
import { useAppTheme } from '@/Shared/Theme';
import { Forecast, Place } from '@/Shared/Types';

type Props = {
  place: Place;
  forecast: Forecast;
  view: ForecastView;
  isFavourite: boolean;
  onToggleFavourite: () => void;
};

// The big "now" card: temperature, weather, and the Nordic extras (wind W-23, wear W-24, daylight W-26).
// Only shows text: every value comes ready from the ViewModel, every sentence from a Format_ function.
export function CurrentWeatherCard({ place, forecast, view, isFavourite, onToggleFavourite }: Props) {
  const theme = useAppTheme();
  const now = forecast.current;
  const weather = Format_Weather(now.weatherCode, now.isDay);
  const windWarning = Format_WindWarning(view.windWarningNow, now.windGustsMs);
  const warningColour = view.windWarningNow === 'storm' ? theme.danger : theme.warning;

  return (
    <Card>
      <View style={styles.titleRow}>
        <Text style={[styles.place, { color: theme.text }]} numberOfLines={2}>{place.name}</Text>
        <Pressable onPress={onToggleFavourite} hitSlop={12} accessibilityRole="button"
          accessibilityLabel={isFavourite ? 'Remove from favourites' : 'Save as favourite'}>
          <Text style={[styles.star, { color: isFavourite ? theme.warning : theme.textMuted }]}>{isFavourite ? '★' : '☆'}</Text>
        </Pressable>
      </View>

      <View style={styles.nowRow}>
        <Text style={styles.icon}>{weather.icon}</Text>
        <Text style={[styles.temperature, { color: theme.text }]}>{Format_Temperature(now.temperatureC)}</Text>
        <View>
          <Text style={[styles.label, { color: theme.text }]}>{weather.label}</Text>
          <Text style={{ color: theme.textMuted }}>Feels like {Format_Temperature(now.feelsLikeC)}</Text>
          <Text style={{ color: theme.textMuted }}>
            High {Format_Temperature(view.today.maxC)} · Low {Format_Temperature(view.today.minC)}
          </Text>
        </View>
      </View>

      <Text style={{ color: theme.textMuted }}>
        💨 Wind {Math.round(now.windSpeedMs)} m/s, gusts {Math.round(now.windGustsMs)} m/s
      </Text>
      {windWarning !== null && (
        <Text style={[styles.badge, { color: warningColour, borderColor: warningColour }]}>⚠️ {windWarning}</Text>
      )}

      <Text style={{ color: theme.text }}>🧥 {Format_Outfit(view.outfitToday)}</Text>

      <Text style={{ color: theme.textMuted }}>
        🌅 {Format_Time(view.today.sunrise)}  ·  🌇 {Format_Time(view.today.sunset)}
      </Text>
      <Text style={{ color: theme.textMuted }}>{Format_DaylightChange(view.daylightChangeMinutes)}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  place: { fontSize: 22, fontWeight: '700', flex: 1 },
  star: { fontSize: 28 },
  nowRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { fontSize: 48 },
  temperature: { fontSize: 56, fontWeight: '300' },
  label: { fontSize: 16, fontWeight: '600' },
  badge: { alignSelf: 'flex-start', borderWidth: 1.5, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, fontWeight: '600' },
});
