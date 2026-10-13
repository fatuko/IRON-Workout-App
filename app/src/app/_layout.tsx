import { useEffect, useRef, useState } from 'react';
import type { ComponentProps } from 'react';
import { Tabs } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { StatusBar } from 'expo-status-bar';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/theme';

const BAR_HORIZONTAL_PADDING = 7;

const tabDetails: Record<string, { label: string; icon: SymbolViewProps['name'] }> = {
  index: { label: 'Home', icon: { ios: 'house.fill', android: 'home', web: 'home' } },
  splits: { label: 'Splits', icon: { ios: 'square.grid.2x2.fill', android: 'grid_view', web: 'grid_view' } },
  workout: { label: 'Workout', icon: { ios: 'dumbbell.fill', android: 'fitness_center', web: 'fitness_center' } },
  history: { label: 'History', icon: { ios: 'clock.arrow.circlepath', android: 'history', web: 'history' } },
  progression: { label: 'Progress', icon: { ios: 'chart.line.uptrend.xyaxis', android: 'trending_up', web: 'trending_up' } },
};

type PillTabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

function PillTabBar({ state, descriptors, navigation, insets }: PillTabBarProps) {
  const [barWidth, setBarWidth] = useState(0);
  const activeIndex = useRef(new Animated.Value(state.index)).current;
  const innerWidth = Math.max(0, barWidth - BAR_HORIZONTAL_PADDING * 2);
  const itemWidth = innerWidth > 0 ? innerWidth / state.routes.length : 0;

  useEffect(() => {
    Animated.spring(activeIndex, {
      toValue: state.index,
      damping: 20,
      stiffness: 180,
      mass: 0.8,
      useNativeDriver: true,
    }).start();
  }, [activeIndex, state.index]);

  return (
    <View
      onLayout={(event) => setBarWidth(event.nativeEvent.layout.width)}
      style={[styles.tabBar, { bottom: Math.max(insets.bottom, 14) }]}
    >
      {itemWidth > 0 && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.indicatorTrack,
            {
              width: itemWidth,
              transform: [{ translateX: Animated.multiply(activeIndex, itemWidth) }],
            },
          ]}
        >
          <View style={styles.activeIndicator} />
        </Animated.View>
      )}

      {state.routes.map((route, index) => {
        const details = tabDetails[route.name];
        const options = descriptors[route.key].options;
        const focused = state.index === index;
        const color = focused ? colors.accent : colors.textMuted;

        const onPress = () => {
          void Haptics.selectionAsync();
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={focused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel ?? details.label}
            onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
            onPress={onPress}
            style={({ pressed }) => [styles.tabItem, pressed && styles.tabItemPressed]}
          >
            <SymbolView name={details.icon} size={21} tintColor={color} />
            <Text style={[styles.tabLabel, { color }]}>{details.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Tabs
        tabBar={(props) => <PillTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          sceneStyle: { backgroundColor: colors.background },
        }}
      >
        <Tabs.Screen name="index" options={{ title: 'Home' }} />
        <Tabs.Screen name="splits" options={{ title: 'Splits' }} />
        <Tabs.Screen name="workout" options={{ title: 'Workout' }} />
        <Tabs.Screen name="history" options={{ title: 'History' }} />
        <Tabs.Screen name="progression" options={{ title: 'Progress' }} />
      </Tabs>
    </>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    left: 26,
    right: 26,
    height: 68,
    paddingHorizontal: 7,
    paddingTop: 9,
    paddingBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 34,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'stretch',
    overflow: 'hidden',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
  },
  indicatorTrack: {
    position: 'absolute',
    top: 4,
    left: BAR_HORIZONTAL_PADDING,
    alignItems: 'center',
  },
  activeIndicator: {
    width: 28,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.accent,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  tabItemPressed: { opacity: 0.6 },
  tabLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.35,
  },
});
