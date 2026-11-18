import { ReactNode } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useAppTheme } from '@/Shared/Theme';

// A rounded box in the theme's card colour. Every section of a screen sits in one.
export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const theme = useAppTheme();
  return <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 8 },
});
