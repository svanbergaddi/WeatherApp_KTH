import { useLocalSearchParams } from 'expo-router';
import { PlaceholderScreen } from '@/Shared/Components/PlaceholderScreen';

// Placeholder. Real screen: W-02, W-07
export function DayDetailScreen() {
  const { date } = useLocalSearchParams<{ date: string }>();
  return <PlaceholderScreen title={`Day: ${date}`} />;
}
