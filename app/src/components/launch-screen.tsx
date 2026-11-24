import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { colors } from '@/constants/theme';

type Props = { ready: boolean; onComplete(): void };

export function LaunchScreen({ ready, onComplete }: Props) {
  const colorFade = useRef(new Animated.Value(0)).current;
  const visibility = useRef(new Animated.Value(0)).current;
  const [introFinished, setIntroFinished] = useState(false);

  useEffect(() => {
    const animation = Animated.sequence([
      Animated.timing(visibility, { toValue: 1, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.delay(700),
      Animated.timing(colorFade, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }),
      Animated.delay(1000),
    ]);
    animation.start(({ finished }) => { if (finished) setIntroFinished(true); });
    return () => animation.stop();
  }, [colorFade, visibility]);

  useEffect(() => {
    if (!ready || !introFinished) return;
    const exit = Animated.timing(visibility, { toValue: 0, duration: 350, easing: Easing.inOut(Easing.quad), useNativeDriver: true });
    exit.start(({ finished }) => { if (finished) onComplete(); });
    return () => exit.stop();
  }, [ready, introFinished, onComplete, visibility]);

  return (
    <View style={styles.screen} onLayout={() => { void SplashScreen.hideAsync().catch(() => {}); }}>
      <Animated.View accessible accessibilityRole="header" accessibilityLabel="IRON" style={[styles.wordmark, { opacity: visibility }]}>
        <Text numberOfLines={1} adjustsFontSizeToFit style={styles.logo}>IRON</Text>
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: colorFade }]}>
          <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.logo, { color: colors.accent }]}>IRON</Text>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000000', alignItems: 'center', justifyContent: 'center' },
  wordmark: { width: '86%', maxWidth: 380 },
  logo: { color: '#FFFFFF', fontSize: 88, fontWeight: '900', letterSpacing: -3, textAlign: 'center', includeFontPadding: false },
});
