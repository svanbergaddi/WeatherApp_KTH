import { StyleSheet } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { SCENE_COLOURS } from '@/Shared/Theme';
import { FallingParticles } from '@/Theme/Scenes/FallingParticles';

const C = SCENE_COLOURS.winter;

// A pine tree: three stacked triangles on a hill, at x with a size.
function pine(x: number, baseY: number, size: number) {
  return `M${x} ${baseY - size * 2.2} L${x - size * 0.7} ${baseY - size * 1.2} L${x + size * 0.7} ${baseY - size * 1.2} Z ` +
    `M${x} ${baseY - size * 1.7} L${x - size * 0.9} ${baseY - size * 0.5} L${x + size * 0.9} ${baseY - size * 0.5} Z ` +
    `M${x} ${baseY - size * 1.1} L${x - size * 1.1} ${baseY} L${x + size * 1.1} ${baseY} Z`;
}

// ---- Winter (W-30): snow falling over snowy hills and pines ----
export function WinterScene({ height, reduceMotion }: { height: number; reduceMotion: boolean }) {
  return (
    <>
      <Svg width="100%" height="100%" viewBox="0 0 360 160" preserveAspectRatio="xMidYMid slice" style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="winterSky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={C.skyTop} />
            <Stop offset="1" stopColor={C.skyBottom} />
          </LinearGradient>
        </Defs>
        <Rect width="360" height="160" fill="url(#winterSky)" />
        <Path d="M0 160 L0 108 Q 90 80 180 104 T 360 96 L360 160 Z" fill={C.hillBack} />
        <Path d={[pine(40, 112, 14), pine(70, 108, 10), pine(250, 104, 16), pine(285, 100, 11), pine(320, 102, 13)].join(' ')} fill={C.pine} />
        <Path d="M0 160 L0 130 Q 120 112 220 128 T 360 124 L360 160 Z" fill={C.hillFront} />
      </Svg>
      <FallingParticles
        count={22} height={height} durationMs={7000} swayPx={14} spin={false} reduceMotion={reduceMotion}
        renderParticle={(i) => (
          <Svg width={8} height={8}>
            <Circle cx={4} cy={4} r={1.5 + (i % 3) * 0.7} fill={C.snow} />
          </Svg>
        )}
      />
    </>
  );
}
