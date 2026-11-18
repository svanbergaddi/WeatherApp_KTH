import { StyleSheet } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { SCENE_COLOURS } from '@/Shared/Theme';
import { FallingParticles } from '@/Theme/Scenes/FallingParticles';

const C = SCENE_COLOURS.spring;

// A birch: a thin white trunk with black marks, and a light green crown.
function Birch({ x, baseY, height }: { x: number; baseY: number; height: number }) {
  const top = baseY - height;
  return (
    <G>
      <Ellipse cx={x} cy={top + 6} rx={height * 0.32} ry={height * 0.3} fill={C.crown} />
      <Rect x={x - 2.5} y={top + 4} width={5} height={height - 4} fill={C.birchTrunk} />
      {[0.35, 0.55, 0.75].map((at) => (
        <Rect key={at} x={x - 2.5} y={top + height * at} width={3} height={1.6} fill={C.birchMark} />
      ))}
    </G>
  );
}

// ---- Spring (W-30): birches on a green meadow, small leaves drifting in the wind ----
export function SpringScene({ height, reduceMotion }: { height: number; reduceMotion: boolean }) {
  return (
    <>
      <Svg width="100%" height="100%" viewBox="0 0 360 160" preserveAspectRatio="xMidYMid slice" style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="springSky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={C.skyTop} />
            <Stop offset="1" stopColor={C.skyBottom} />
          </LinearGradient>
        </Defs>
        <Rect width="360" height="160" fill="url(#springSky)" />
        <Circle cx="60" cy="38" r="16" fill={C.sun} />
        <Path d="M0 160 L0 112 Q 100 92 200 110 T 360 104 L360 160 Z" fill={C.meadowBack} />
        <Birch x={230} baseY={118} height={62} />
        <Birch x={262} baseY={122} height={50} />
        <Birch x={300} baseY={116} height={70} />
        <Birch x={110} baseY={124} height={44} />
        <Path d="M0 160 L0 134 Q 140 120 250 134 T 360 130 L360 160 Z" fill={C.meadowFront} />
      </Svg>
      <FallingParticles
        count={8} height={height} durationMs={11000} swayPx={40} spin reduceMotion={reduceMotion}
        renderParticle={() => (
          <Svg width={10} height={10}>
            <Path d="M5 0 C 9 3, 9 7, 5 10 C 1 7, 1 3, 5 0 Z" fill={C.leaf} />
          </Svg>
        )}
      />
    </>
  );
}
