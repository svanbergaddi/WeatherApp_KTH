import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { FavouritesProvider } from '@/Favourites/FavouritesViewModel';
import { ForecastProvider } from '@/Forecast/ForecastViewModel';
import { SettingsProvider } from '@/Settings/SettingsViewModel';
import { useAppTheme } from '@/Shared/Theme';

// The providers wrap everything, so every screen shares ONE copy of settings, forecast and favourites.
// Settings is outermost because the forecast and the theme read from it.
export default function RootLayout() {
  return (
    <SettingsProvider>
      <ForecastProvider>
        <FavouritesProvider>
          <ThemedStack />
        </FavouritesProvider>
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
