import { StyleSheet, View } from 'react-native';
import { AppTheme, useAppTheme } from '@/Shared/Theme';
import { AutumnScene } from '@/Theme/Scenes/AutumnScene';
import { NightScene } from '@/Theme/Scenes/NightScene';
import { useReduceMotion } from '@/Theme/Scenes/SceneAnimation';
import { SpringScene } from '@/Theme/Scenes/SpringScene';
import { SummerScene } from '@/Theme/Scenes/SummerScene';
import { WinterScene } from '@/Theme/Scenes/WinterScene';

const HEIGHT = 150;

// ---- The animated picture at the top of the home screen (W-30) ----
// Shows the scene for the palette in use right now: Nordic night, or the season's light theme.
// It's decoration, so screen readers skip it (the weather is all in the card below).
// Reduce motion is checked ONCE here and passed down, so every animation in the scene obeys it.
// `sceneName` shows a chosen scene instead (the preview in Settings); without it, the current theme's scene.
export function SceneBanner({ sceneName }: { sceneName?: AppTheme['name'] }) {
  const theme = useAppTheme();
  const reduceMotion = useReduceMotion();
  const name = sceneName ?? theme.name;

  return (
    <View
      style={[styles.banner, { borderColor: theme.border }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
    >
      {name === 'night' && <NightScene reduceMotion={reduceMotion} />}
      {name === 'winter' && <WinterScene height={HEIGHT} reduceMotion={reduceMotion} />}
      {name === 'spring' && <SpringScene height={HEIGHT} reduceMotion={reduceMotion} />}
      {name === 'summer' && <SummerScene reduceMotion={reduceMotion} />}
      {name === 'autumn' && <AutumnScene height={HEIGHT} reduceMotion={reduceMotion} />}
    </View>
  );
}

const styles = StyleSheet.create({
  // overflow hidden: snowflakes and leaves outside the rounded box aren't drawn.
  banner: { height: HEIGHT, borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
});
