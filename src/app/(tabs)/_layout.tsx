import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { useAppTheme } from '@/Shared/Theme';

// The four tabs. Colours come from the theme, so the tab bar and headers turn dark in Nordic night too.
export default function TabsLayout() {
  const theme = useAppTheme();

  // A small emoji as the tab icon. Faded when the tab isn't selected.
  const icon = (emoji: string) => ({ focused }: { focused: boolean }) => (
    <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>
  );

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: theme.card },
        headerTintColor: theme.text,
        tabBarStyle: { backgroundColor: theme.card, borderTopColor: theme.border },
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.textMuted,
        sceneStyle: { backgroundColor: theme.background },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Weather', tabBarIcon: icon('🌦️') }} />
      <Tabs.Screen name="compare" options={{ title: 'Compare', tabBarIcon: icon('⚖️') }} />
      <Tabs.Screen name="favourites" options={{ title: 'Favourites', tabBarIcon: icon('⭐') }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings', tabBarIcon: icon('⚙️') }} />
    </Tabs>
  );
}
