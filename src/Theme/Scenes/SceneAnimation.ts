import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing } from 'react-native';

// ---- useReduceMotion: has the user asked the phone for less motion? (W-30) ----
// iPhone: Settings → Accessibility → Motion → Reduce Motion. Android: "Remove animations".
// Some people get dizzy or sick from moving things, so then every scene stands still.
// We also listen for changes, so switching it on while the app is open stops the animations at once.
// Called ONCE per scene (in SceneBanner) and passed down, instead of once per snowflake.
export function useReduceMotion(): boolean {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => subscription.remove();
  }, []);

  return reduceMotion;
}

// ---- useLoop: a value that goes 0 → 1 over and over, for one moving thing in a scene ----
// `delayMs` makes things start at different times, so the snowflakes don't all fall together.
// `stillAt` is where the thing stands when reduce motion is on (0…1), so a still scene still looks natural.
// useNativeDriver: the phone's UI thread runs the animation, so it stays smooth even when the app is busy.
// That only works for moving, turning, scaling and fading, which is all the scenes do.
export function useLoop(reduceMotion: boolean, durationMs: number, delayMs: number, stillAt: number): Animated.Value {
  const value = useRef(new Animated.Value(stillAt)).current;

  useEffect(() => {
    if (reduceMotion) {
      value.setValue(stillAt);
      return;
    }
    value.setValue(0);
    const animation = Animated.loop(
      Animated.timing(value, { toValue: 1, duration: durationMs, delay: delayMs, easing: Easing.linear, useNativeDriver: true }),
    );
    animation.start();
    return () => animation.stop(); // the scene left the screen, or reduce motion was switched on
  }, [reduceMotion, durationMs, delayMs, stillAt]);

  return value;
}
