import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card } from '@/Shared/Components/Card';
import { Format_Temperature, Format_Time, Format_Weather } from '@/Shared/FormatHelpers';
import { useAppTheme } from '@/Shared/Theme';
import { HourlyPoint } from '@/Shared/Types';

// Today hour by hour (W-07), scrolled sideways. Rain chance only shows when there's a real chance.
export function HourlyStrip({ hours, title = 'Today' }: { hours: HourlyPoint[]; title?: string }) {
  const theme = useAppTheme();

  return (
    <Card>
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      {hours.length === 0 && <Text style={{ color: theme.textMuted }}>No more hours today.</Text>}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {hours.map((hour) => (
          <View key={hour.time} style={styles.hour}>
            <Text style={{ color: theme.textMuted }}>{Format_Time(hour.time)}</Text>
            <Text style={styles.icon}>{Format_Weather(hour.weatherCode).icon}</Text>
            <Text style={[styles.temperature, { color: theme.text }]}>{Format_Temperature(hour.temperatureC)}</Text>
            <Text style={[styles.rain, { color: theme.accent }]}>
              {hour.precipitationChancePercent >= 20 ? `${hour.precipitationChancePercent}%` : ' '}
            </Text>
          </View>
        ))}
      </ScrollView>
    </Card>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 16, fontWeight: '600' },
  row: { gap: 16 },
  hour: { alignItems: 'center', gap: 4, minWidth: 44 },
  icon: { fontSize: 22 },
  temperature: { fontSize: 16, fontWeight: '600' },
  rain: { fontSize: 12 },
});
