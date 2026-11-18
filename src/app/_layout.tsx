import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { FavouritesProvider } from '@/Favourites/FavouritesViewModel';
import { ForecastProvider } from '@/Forecast/ForecastViewModel';
import { SettingsProvider } from '@/Settings/SettingsViewModel';
import { useAppTheme } from '@/Shared/Theme';
import { ThemeProvider } from '@/Theme/ThemeViewModel';

// The providers wrap everything, so every screen shares ONE copy of settings, forecast, theme and favourites.
// The order matters: each provider can only read the ones OUTSIDE it.
//   Settings → Forecast (reads the refresh rate) → Theme (reads the theme choice + the viewed city) → Favourites
export default function RootLayout() {
  return (
    <SettingsProvider>
      <ForecastProvider>
        <ThemeProvider>
          <FavouritesProvider>
            <ThemedStack />
          </FavouritesProvider>
        </ThemeProvider>
      </ForecastProvider>
    </SettingsProvider>
  );
}

// Root navigator: the tab bar, plus the day detail screen that opens on top of it.
// A separate component because useAppTheme reads the settings, so it must be INSIDE SettingsProvider.
function ThemedStack() {
  const theme = useAppTheme();

  return (
    <>
      {/* Light status bar icons on the dark night theme, dark icons on the light theme. */}
      <StatusBar style={theme.isNight ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: theme.card },
          headerTintColor: theme.text,
          contentStyle: { backgroundColor: theme.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="day/[date]" options={{ title: 'Day' }} />
      </Stack>
    </>
  );
}
