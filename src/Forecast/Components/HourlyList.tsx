import { StyleSheet, Text, View } from 'react-native';
import { Card } from '@/Shared/Components/Card';
import { Format_Temperature, Format_Time, Format_Weather } from '@/Shared/FormatHelpers';
import { useAppTheme } from '@/Shared/Theme';
import { HourlyPoint } from '@/Shared/Types';

// One day hour by hour, top to bottom (W-02). More detail than the home screen's sideways strip:
// feels-like, rain chance and gusts on every row. Strong gusts (14 m/s+, same limit as the warning) are coloured.
const STRONG_GUSTS_MS = 14;

export function HourlyList({ hours }: { hours: HourlyPoint[] }) {
  const theme = useAppTheme();

  return (
    <Card>
      <View style={styles.row}>
        <Text style={[styles.time, styles.header, { color: theme.textMuted }]}>Time</Text>
        <Text style={[styles.icon, styles.header]} />
        <Text style={[styles.temperature, styles.header, { color: theme.textMuted }]}>Temp</Text>
        <Text style={[styles.cell, styles.header, { color: theme.textMuted }]}>Feels</Text>
        <Text style={[styles.cell, styles.header, { color: theme.textMuted }]}>Rain</Text>
        <Text style={[styles.cell, styles.header, { color: theme.textMuted }]}>Gusts</Text>
      </View>
      {hours.length === 0 && <Text style={{ color: theme.textMuted }}>No hours left today.</Text>}
      {hours.map((hour) => (
        <View key={hour.time} style={[styles.row, { borderTopWidth: 1, borderTopColor: theme.border }]}>
          <Text style={[styles.time, { color: theme.text }]}>{Format_Time(hour.time)}</Text>
          <Text style={styles.icon}>{Format_Weather(hour.weatherCode).icon}</Text>
          <Text style={[styles.temperature, { color: theme.text }]}>{Format_Temperature(hour.temperatureC)}</Text>
          <Text style={[styles.cell, { color: theme.textMuted }]}>{Format_Temperature(hour.feelsLikeC)}</Text>
          <Text style={[styles.cell, { color: theme.accent }]}>{hour.precipitationChancePercent}%</Text>
          <Text style={[styles.cell, { color: hour.windGustsMs >= STRONG_GUSTS_MS ? theme.warning : theme.textMuted }]}>
            {Math.round(hour.windGustsMs)} m/s
          </Text>
        </View>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 6 },
  header: { fontSize: 12, fontWeight: '600' },
  time: { width: 48 },
  icon: { width: 28, fontSize: 18 },
  temperature: { width: 44, fontWeight: '600' },
  cell: { flex: 1, textAlign: 'right' },
});
