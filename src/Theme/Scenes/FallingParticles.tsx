import { ReactNode } from 'react';
import { Animated } from 'react-native';
import { Calc_Spread } from '@/Theme/ThemeHelpers';
import { useLoop } from '@/Theme/Scenes/SceneAnimation';

type Props = {
  count: number; // how many snowflakes / leaves
  height: number; // how far they fall (the banner's height)
  durationMs: number; // roughly how long one fall takes; each one gets a bit faster or slower
  swayPx: number; // how far they drift sideways while falling
  spin: boolean; // leaves turn while falling, snow doesn't
  reduceMotion: boolean;
  renderParticle: (index: number) => ReactNode; // what one particle looks like (a small SVG)
};

// ---- Falling snow or leaves (W-30) ----
// Each particle is its own small Animated.View, moved down (translateY) and sideways (translateX).
// Used by the winter, spring and autumn scenes, which only differ in what falls.
export function FallingParticles(props: Props) {
  return (
    <>
      {Array.from({ length: props.count }, (_, index) => (
        <Particle key={index} index={index} {...props}>{props.renderParticle(index)}</Particle>
      ))}
    </>
  );
}

function Particle({ index, height, durationMs, swayPx, spin, reduceMotion, children }: Props & { index: number; children: ReactNode }) {
  // Calc_Spread gives each particle its own start place, speed and start time, the same on every redraw.
  const duration = durationMs * (0.75 + Calc_Spread(index, 3) * 0.6);
  const progress = useLoop(reduceMotion, duration, Calc_Spread(index, 5) * durationMs, Calc_Spread(index, 7));

  // progress 0 → 1 becomes: from just above the banner to just below it, drifting sideways and back.
  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [-24, height + 24] });
  const translateX = progress.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, swayPx, 0] });
  const rotate = progress.interpolate({ inputRange: [0, 1], outputRange: ['0deg', spin ? '360deg' : '0deg'] });

  return (
    <Animated.View
      pointerEvents="none"
      style={{ position: 'absolute', top: 0, left: `${Calc_Spread(index, 1) * 100}%`, transform: [{ translateY }, { translateX }, { rotate }] }}
    >
      {children}
    </Animated.View>
  );
}
