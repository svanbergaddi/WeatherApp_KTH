import { router, Stack, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { DaySummaryCard } from '@/Forecast/Components/DaySummaryCard';
import { HourlyList } from '@/Forecast/Components/HourlyList';
import { useForecastViewModel } from '@/Forecast/ForecastViewModel';
import { StatusBanner } from '@/Shared/Components/StatusBanner';
import { Format_DayName } from '@/Shared/FormatHelpers';
import { useAppTheme } from '@/Shared/Theme';

// ---- Day detail screen (W-02) ----
// Opens when a day is tapped in the 7-day list. The date comes from the address: /day/2026-11-19.
// The data comes from the SHARED forecast (no new API call), so it always matches the home screen.
export function DayDetailScreen() {
  const theme = useAppTheme();
  const { date } = useLocalSearchParams<{ date: string }>();
  const forecast = useForecastViewModel();
  const dayView = forecast.Process_GetDay(date);

  const { width, height } = useWindowDimensions();
  const isLandscape = width > height; // W-10: summary and hours side by side

  // The day isn't in the forecast (an old link, or the forecast moved on): explain and offer a way back.
  if (dayView === null) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Stack.Screen options={{ title: 'Day' }} />
        <StatusBanner tone="error" message="This day isn't in the current forecast."
          detail={forecast.place?.name} actionLabel="Back" onAction={() => router.back()} />
      </View>
    );
  }

  return (
    <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={styles.container}>
      {/* Sets the title in the header bar: "Today", "Thu 19" … */}
      <Stack.Screen options={{ title: `${Format_DayName(date, dayView.todayDate)} · ${forecast.place?.name ?? ''}` }} />

      <View style={isLandscape ? styles.columns : styles.stack}>
        <View style={isLandscape ? styles.column : undefined}>
          <DaySummaryCard dayView={dayView} />
        </View>
        <View style={isLandscape ? styles.column : undefined}>
          {dayView.isToday && <Text style={[styles.note, { color: theme.textMuted }]}>From now on</Text>}
          <HourlyList hours={dayView.hours} />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16, paddingBottom: 32 },
  stack: { gap: 16 },
  columns: { flexDirection: 'row', gap: 16, alignItems: 'flex-start' },
  column: { flex: 1 },
  note: { marginBottom: 6 },
});
