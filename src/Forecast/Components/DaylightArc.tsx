import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { Format_Time } from '@/Shared/FormatHelpers';
import { useAppTheme } from '@/Shared/Theme';

type Props = {
  sunrise: string; // local time text
  sunset: string;
  progress: number | null; // 0 = sunrise … 1 = sunset, null = the sun is down
};

// The arc is half an ellipse in a 200 × 70 drawing: from (10, 60) over the top (100, 10) to (190, 60).
const LEFT_X = 10;
const CENTRE_X = 100;
const BASE_Y = 60;
const RADIUS_X = 90;
const RADIUS_Y = 50;
const FULL_ARC = `M ${LEFT_X} ${BASE_Y} A ${RADIUS_X} ${RADIUS_Y} 0 0 1 ${CENTRE_X + RADIUS_X} ${BASE_Y}`;

// Where the sun is on the arc for a progress 0…1. The angle goes from 180° (left, sunrise) to 0° (right, sunset).
function pointOnArc(progress: number): { x: number; y: number } {
  const angle = Math.PI * (1 - progress);
  return { x: CENTRE_X + RADIUS_X * Math.cos(angle), y: BASE_Y - RADIUS_Y * Math.sin(angle) };
}

// ---- Daylight arc (W-26, W-30) ----
// The sun's path today: dashed for the whole day, solid for the part it has already travelled.
export function DaylightArc({ sunrise, sunset, progress }: Props) {
  const theme = useAppTheme();
  const sun = progress === null ? null : pointOnArc(progress);
  // The travelled part: the same ellipse, but stopping at the sun.
  const travelled = sun === null ? null : `M ${LEFT_X} ${BASE_Y} A ${RADIUS_X} ${RADIUS_Y} 0 0 1 ${sun.x} ${sun.y}`;

  return (
    <View accessible accessibilityLabel={
      progress === null
        ? `The sun is down. Sunrise ${Format_Time(sunrise)}, sunset ${Format_Time(sunset)}.`
        : `The sun is ${Math.round(progress * 100)} percent of the way from sunrise to sunset.`
    }>
      <Svg width="100%" height={70} viewBox="0 0 200 70">
        <Path d={FULL_ARC} stroke={theme.border} strokeWidth={2} strokeDasharray="4 4" fill="none" />
        {travelled !== null && <Path d={travelled} stroke={theme.warning} strokeWidth={3} fill="none" />}
        <Path d={`M 0 ${BASE_Y} L 200 ${BASE_Y}`} stroke={theme.border} strokeWidth={1} />
        {sun !== null && <Circle cx={sun.x} cy={sun.y} r={7} fill={theme.warning} />}
      </Svg>
      <View style={styles.labels}>
        <Text style={{ color: theme.textMuted }}>🌅 {Format_Time(sunrise)}</Text>
        {progress === null && <Text style={{ color: theme.textMuted }}>The sun is down</Text>}
        <Text style={{ color: theme.textMuted }}>🌇 {Format_Time(sunset)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  labels: { flexDirection: 'row', justifyContent: 'space-between' },
});
