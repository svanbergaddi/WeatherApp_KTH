import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '@/Shared/Theme';

type Props = {
  tone: 'warning' | 'error'; // warning = offline but we have data, error = nothing to show
  message: string;
  detail?: string; // e.g. "Last updated 14:05"
  actionLabel?: string; // e.g. "Try again"
  onAction?: () => void;
};

// A coloured strip with a message, used for the offline and error states (W-09, W-15, W-19).
// Never a blank screen: the user always sees what went wrong and what they can do.
export function StatusBanner({ tone, message, detail, actionLabel, onAction }: Props) {
  const theme = useAppTheme();
  const colour = tone === 'error' ? theme.danger : theme.warning;

  return (
    <View style={[styles.banner, { borderColor: colour }]} accessibilityRole="alert">
      <View style={styles.texts}>
        <Text style={[styles.message, { color: colour }]}>{message}</Text>
        {detail !== undefined && <Text style={{ color: theme.textMuted }}>{detail}</Text>}
      </View>
      {actionLabel !== undefined && onAction !== undefined && (
        <Pressable onPress={onAction} style={[styles.button, { backgroundColor: colour }]} accessibilityRole="button">
          <Text style={[styles.buttonText, { color: theme.card }]}>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1.5, borderRadius: 12, padding: 12 },
  texts: { flex: 1, gap: 2 },
  message: { fontWeight: '600' },
  button: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  buttonText: { fontWeight: '600' },
});
