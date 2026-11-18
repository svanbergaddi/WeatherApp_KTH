import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from '@/Shared/Components/Card';
import { Format_DayName, Format_Temperature, Format_Weather } from '@/Shared/FormatHelpers';
import { useAppTheme } from '@/Shared/Theme';
import { DailySummary } from '@/Shared/Types';

// The 7-day overview (W-06, W-12): one row per day. Tapping a row opens that day (W-02).
export function DailyList({ days, todayDate }: { days: DailySummary[]; todayDate: string }) {
  const theme = useAppTheme();

  return (
    <Card>
      <Text style={[styles.title, { color: theme.text }]}>7 days</Text>
      {days.map((day, i) => {
        const weather = Format_Weather(day.weatherCode);
        return (
          <Pressable
            key={day.date}
            onPress={() => router.push(`/day/${day.date}`)}
            style={[styles.row, i > 0 && { borderTopWidth: 1, borderTopColor: theme.border }]}
            accessibilityRole="button"
            accessibilityLabel={`${Format_DayName(day.date, todayDate)}, ${weather.label}, high ${Format_Temperature(day.maxC)}, low ${Format_Temperature(day.minC)}`}
          >
            <Text style={[styles.day, { color: theme.text }]}>{Format_DayName(day.date, todayDate)}</Text>
            <Text style={styles.icon}>{weather.icon}</Text>
            <Text style={[styles.rain, { color: theme.accent }]}>
              {day.precipitationMm >= 0.5 ? `${day.precipitationMm.toFixed(1)} mm` : ''}
            </Text>
            <View style={styles.temperatures}>
              <Text style={[styles.max, { color: theme.text }]}>{Format_Temperature(day.maxC)}</Text>
              <Text style={{ color: theme.textMuted }}>{Format_Temperature(day.minC)}</Text>
            </View>
            <Text style={{ color: theme.textMuted }}>›</Text>
          </Pressable>
        );
      })}
    </Card>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 16, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12 },
  day: { width: 64, fontWeight: '600' },
  icon: { fontSize: 22, width: 32 },
  rain: { flex: 1, fontSize: 13 },
  temperatures: { flexDirection: 'row', gap: 10, width: 72, justifyContent: 'flex-end' },
  max: { fontWeight: '600' },
});
