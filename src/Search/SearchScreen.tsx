import { Link } from 'expo-router';
import { PlaceholderScreen } from '@/Shared/Components/PlaceholderScreen';

// Placeholder. Real screen: W-01, W-21, W-22
export function SearchScreen() {
  return (
    <PlaceholderScreen title="Weather">
      <Link href="/day/2026-11-17">Open a test day →</Link>
    </PlaceholderScreen>
  );
}
