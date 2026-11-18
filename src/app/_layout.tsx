import { Stack } from 'expo-router';

// Root navigator: the tab bar, plus the day detail screen that opens on top of it.
export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="day/[date]" options={{ title: 'Day' }} />
    </Stack>
  );
}
