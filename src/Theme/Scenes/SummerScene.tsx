import { Animated, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { SCENE_COLOURS } from '@/Shared/Theme';
import { useLoop } from '@/Theme/Scenes/SceneAnimation';

const C = SCENE_COLOURS.summer;

// A long wavy line that repeats every 60 px. Moving it 60 px to the left looks exactly like the start,
// so looping that move makes an endless wave.
const WAVELENGTH = 60;
const WAVE_PATH = (() => {
  let d = `M0 6 Q ${WAVELENGTH / 4} 0 ${WAVELENGTH / 2} 6`;
  for (let x = WAVELENGTH; x <= 1500; x += WAVELENGTH / 2) d += ` T ${x} 6`;
  return d;
})();

// ---- Summer (W-30): a glowing sun, skerries, waves rolling, a small sailboat bobbing ----
export function SummerScene({ reduceMotion }: { reduceMotion: boolean }) {
  const wavesSlow = useLoop(reduceMotion, 4000, 0, 0.3);
  const wavesFast = useLoop(reduceMotion, 2600, 0, 0.7);
  const glow = useLoop(reduceMotion, 4000, 0, 0.5);

  const waveMove = (value: Animated.Value) => ({
    transform: [{ translateX: value.interpolate({ inputRange: [0, 1], outputRange: [0, -WAVELENGTH] }) }],
  });
  const sunGlow = { transform: [{ scale: glow.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.12, 1] }) }] };
  const boatBob = { transform: [{ translateY: glow.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, -2, 0] }) }] };

  return (
    <>
      <Svg width="100%" height="100%" viewBox="0 0 360 160" preserveAspectRatio="xMidYMid slice" style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="summerSky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={C.skyTop} />
            <Stop offset="1" stopColor={C.skyBottom} />
          </LinearGradient>
        </Defs>
        <Rect width="360" height="160" fill="url(#summerSky)" />
        <Rect y="108" width="360" height="52" fill={C.sea} />
        <Path d="M20 110 Q 50 88 90 110 Z" fill={C.island} />
        <Path d="M250 110 Q 275 96 300 110 Z" fill={C.rock} />
      </Svg>

      <Animated.View style={[styles.sun, sunGlow]}>
        <Svg width={44} height={44}><Circle cx={22} cy={22} r={18} fill={C.sun} /></Svg>
      </Animated.View>

      <Animated.View style={[styles.boat, boatBob]}>
        <Svg width={26} height={24}>
          <Path d="M12 2 L12 16 L2 16 Z" fill={C.sail} />
          <Path d="M2 17 L24 17 L20 22 L6 22 Z" fill={C.hull} />
        </Svg>
      </Animated.View>

      <View style={styles.waves} pointerEvents="none">
        <Animated.View style={waveMove(wavesSlow)}>
          <Svg width={1500} height={12}><Path d={WAVE_PATH} stroke={C.wave} strokeWidth={2} fill="none" /></Svg>
        </Animated.View>
        <Animated.View style={[{ marginTop: 10, marginLeft: -20 }, waveMove(wavesFast)]}>
          <Svg width={1500} height={12}><Path d={WAVE_PATH} stroke={C.wave} strokeWidth={1.5} strokeOpacity={0.7} fill="none" /></Svg>
        </Animated.View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  sun: { position: 'absolute', top: 14, right: '16%' },
  boat: { position: 'absolute', top: 92, left: '58%' },
  waves: { position: 'absolute', top: 118, left: 0, right: 0, overflow: 'hidden' },
});
