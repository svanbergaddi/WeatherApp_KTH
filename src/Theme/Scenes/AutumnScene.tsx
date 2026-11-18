import { StyleSheet } from 'react-native';
import Svg, { Circle, Defs, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { SCENE_COLOURS } from '@/Shared/Theme';
import { FallingParticles } from '@/Theme/Scenes/FallingParticles';

const C = SCENE_COLOURS.autumn;
const LEAF_COLOURS = [C.leafRed, C.leafOrange, C.leafBrown];

// A round autumn tree: a trunk and three overlapping circles for the crown.
function Tree({ x, baseY, size, colour }: { x: number; baseY: number; size: number; colour: string }) {
  return (
    <G>
      <Rect x={x - 2} y={baseY - size * 1.6} width={4} height={size * 1.6} fill={C.trunk} />
      <Circle cx={x} cy={baseY - size * 1.9} r={size * 0.75} fill={colour} />
      <Circle cx={x - size * 0.55} cy={baseY - size * 1.45} r={size * 0.55} fill={colour} />
      <Circle cx={x + size * 0.55} cy={baseY - size * 1.45} r={size * 0.55} fill={colour} />
    </G>
  );
}

// ---- Autumn (W-30): rust hills, red and orange trees, leaves spinning down ----
export function AutumnScene({ height, reduceMotion }: { height: number; reduceMotion: boolean }) {
  return (
    <>
      <Svg width="100%" height="100%" viewBox="0 0 360 160" preserveAspectRatio="xMidYMid slice" style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="autumnSky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={C.skyTop} />
            <Stop offset="1" stopColor={C.skyBottom} />
          </LinearGradient>
        </Defs>
        <Rect width="360" height="160" fill="url(#autumnSky)" />
        <Path d="M0 160 L0 110 Q 90 88 180 108 T 360 100 L360 160 Z" fill={C.hillBack} />
        <Tree x={60} baseY={114} size={16} colour={C.leafRed} />
        <Tree x={100} baseY={110} size={12} colour={C.leafOrange} />
        <Tree x={260} baseY={108} size={18} colour={C.leafOrange} />
        <Tree x={305} baseY={106} size={13} colour={C.leafBrown} />
        <Path d="M0 160 L0 132 Q 130 116 240 132 T 360 128 L360 160 Z" fill={C.hillFront} />
      </Svg>
      <FallingParticles
        count={12} height={height} durationMs={9000} swayPx={30} spin reduceMotion={reduceMotion}
        renderParticle={(i) => (
          <Svg width={11} height={11}>
            <Path d="M5.5 0 C 10 3, 10 8, 5.5 11 C 1 8, 1 3, 5.5 0 Z" fill={LEAF_COLOURS[i % LEAF_COLOURS.length]} />
          </Svg>
        )}
      />
    </>
  );
}
