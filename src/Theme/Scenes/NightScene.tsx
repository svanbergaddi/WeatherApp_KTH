import { Animated, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { SCENE_COLOURS } from '@/Shared/Theme';
import { useLoop } from '@/Theme/Scenes/SceneAnimation';
import { Calc_Spread } from '@/Theme/ThemeHelpers';

const C = SCENE_COLOURS.night;
const VIEW_BOX = '0 0 360 160';

// Stars at fixed places (from Calc_Spread), in two groups that twinkle in turn.
const STARS = Array.from({ length: 24 }, (_, i) => ({ x: Calc_Spread(i, 1) * 360, y: Calc_Spread(i, 4) * 80, r: 0.6 + Calc_Spread(i, 2) }));

// ---- Nordic night (W-30): twinkling stars, a waving aurora, a moon over dark mountains ----
export function NightScene({ reduceMotion }: { reduceMotion: boolean }) {
  const aurora = useLoop(reduceMotion, 9000, 0, 0.5);
  const twinkle = useLoop(reduceMotion, 3000, 0, 0.5);

  // The aurora slowly drifts sideways and glows brighter and dimmer.
  const auroraStyle = {
    opacity: aurora.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.55, 0.95, 0.55] }),
    transform: [{ translateX: aurora.interpolate({ inputRange: [0, 0.5, 1], outputRange: [-18, 18, -18] }) }],
  };
  // Half the stars fade while the other half brighten.
  const starsA = { opacity: twinkle.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.35, 1, 0.35] }) };
  const starsB = { opacity: twinkle.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 0.35, 1] }) };

  const starGroup = (keepEven: boolean) => (
    <Svg width="100%" height="100%" viewBox={VIEW_BOX} preserveAspectRatio="xMidYMid slice">
      {STARS.filter((_, i) => (i % 2 === 0) === keepEven).map((star, i) => (
        <Circle key={i} cx={star.x} cy={star.y} r={star.r} fill={C.star} />
      ))}
    </Svg>
  );

  return (
    <>
      <Svg width="100%" height="100%" viewBox={VIEW_BOX} preserveAspectRatio="xMidYMid slice" style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="nightSky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={C.skyTop} />
            <Stop offset="1" stopColor={C.skyBottom} />
          </LinearGradient>
        </Defs>
        <Rect width="360" height="160" fill="url(#nightSky)" />
        <Circle cx="305" cy="34" r="13" fill={C.moon} />
      </Svg>

      <Animated.View style={[StyleSheet.absoluteFill, starsA]}>{starGroup(true)}</Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, starsB]}>{starGroup(false)}</Animated.View>

      <Animated.View style={[StyleSheet.absoluteFill, auroraStyle]}>
        <Svg width="100%" height="100%" viewBox={VIEW_BOX} preserveAspectRatio="xMidYMid slice">
          <Path d="M-30 78 C 40 30, 110 96, 180 52 S 300 28, 390 62" stroke={C.auroraGreen} strokeWidth="18" strokeOpacity="0.55" fill="none" strokeLinecap="round" />
          <Path d="M-30 64 C 50 26, 120 80, 190 44 S 310 22, 390 48" stroke={C.auroraViolet} strokeWidth="8" strokeOpacity="0.4" fill="none" strokeLinecap="round" />
        </Svg>
      </Animated.View>

      <Svg width="100%" height="100%" viewBox={VIEW_BOX} preserveAspectRatio="xMidYMid slice" style={StyleSheet.absoluteFill}>
        <Path d="M0 160 L0 122 L48 98 L88 118 L140 82 L192 114 L240 90 L292 122 L330 102 L360 116 L360 160 Z" fill={C.mountain} />
      </Svg>
    </>
  );
}
