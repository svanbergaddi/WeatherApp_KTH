import { StyleSheet, Text, View } from 'react-native';
import { DayView } from '@/Forecast/ForecastViewModel';
import { Card } from '@/Shared/Components/Card';
import {
  Format_DaylightChange, Format_DaylightLength, Format_Outfit, Format_Temperature, Format_Time, Format_Weather, Format_WindWarning,
} from '@/Shared/FormatHelpers';
import { useAppTheme } from '@/Shared/Theme';

// The summary of one day (W-02): weather, temperatures, rain, wind (+ warning), what to wear, daylight.
export function DaySummaryCard({ dayView }: { dayView: DayView }) {
  const theme = useAppTheme();
  const { day } = dayView;
  const weather = Format_Weather(day.weatherCode);
  const windWarning = Format_WindWarning(dayView.windWarning, day.windGustsMaxMs);
  const warningColour = dayView.windWarning === 'storm' ? theme.danger : theme.warning;

  // One line in the table: a label on the left, the value on the right.
  const row = (label: string, value: string) => (
    <View style={styles.row}>
      <Text style={{ color: theme.textMuted }}>{label}</Text>
      <Text style={[styles.value, { color: theme.text }]}>{value}</Text>
    </View>
  );

  return (
    <Card>
      <View style={styles.top}>
        <Text style={styles.icon}>{weather.icon}</Text>
        <View>
          <Text style={[styles.label, { color: theme.text }]}>{weather.label}</Text>
          <Text style={[styles.temperatures, { color: theme.text }]}>
            {Format_Temperature(day.maxC)} <Text style={{ color: theme.textMuted }}>/ {Format_Temperature(day.minC)}</Text>
          </Text>
        </View>
      </View>

      {row('Feels like (coldest)', Format_Temperature(day.feelsLikeMinC))}
      {row('Rain', `${day.precipitationMm.toFixed(1)} mm`)}
      {row('Wind', `${Math.round(day.windMaxMs)} m/s, gusts ${Math.round(day.windGustsMaxMs)} m/s`)}
      {windWarning !== null && (
        <Text style={[styles.badge, { color: warningColour, borderColor: warningColour }]}>⚠️ {windWarning}</Text>
      )}

      <Text style={{ color: theme.text }}>🧥 {Format_Outfit(dayView.outfit)}</Text>

      <Text style={{ color: theme.textMuted }}>🌅 {Format_Time(day.sunrise)}  ·  🌇 {Format_Time(day.sunset)}</Text>
      <Text style={{ color: theme.textMuted }}>{Format_DaylightLength(day.daylightSeconds)}</Text>
      <Text style={{ color: theme.textMuted }}>{Format_DaylightChange(dayView.daylightChangeMinutes)}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 4 },
  icon: { fontSize: 56 },
  label: { fontSize: 18, fontWeight: '600' },
  temperatures: { fontSize: 32, fontWeight: '300' },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  value: { fontWeight: '600', flexShrink: 1, textAlign: 'right' },
  badge: { alignSelf: 'flex-start', borderWidth: 1.5, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, fontWeight: '600' },
});
