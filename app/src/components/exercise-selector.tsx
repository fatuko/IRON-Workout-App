import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/constants/theme';

const STEP = 56;

type Props = {
  exercises: { id: string; name: string }[];
  selected: number;
  onSelect(index: number): void;
};

export function ExerciseSelector({ exercises, selected, onSelect }: Props) {
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const dragging = useRef(false);
  const current = useRef(selected);
  const [width, setWidth] = useState(0);
  current.current = selected;

  useEffect(() => {
    if (!dragging.current && width) scroll.current?.scrollTo({ x: selected * STEP, animated: false });
  }, [selected, width]);

  const selectAt = (offset: number) => {
    const index = Math.max(0, Math.min(exercises.length - 1, Math.round(offset / STEP)));
    if (index !== current.current) {
      current.current = index;
      onSelect(index);
    }
  };

  return (
    <View onLayout={event => setWidth(event.nativeEvent.layout.width)}>
      <ScrollView
        ref={scroll}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={STEP}
        decelerationRate="fast"
        bounces={false}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingHorizontal: Math.max(0, (width - STEP) / 2) }}
        onScrollBeginDrag={() => { dragging.current = true; }}
        onScroll={event => { if (dragging.current) selectAt(event.nativeEvent.contentOffset.x); }}
        onMomentumScrollEnd={event => { selectAt(event.nativeEvent.contentOffset.x); dragging.current = false; }}>
        {exercises.map((exercise, index) => (
          <View key={exercise.id} style={styles.slot}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Exercise ${index + 1}: ${exercise.name}`}
              accessibilityState={{ selected: index === selected }}
              onPress={() => {
                dragging.current = false;
                onSelect(index);
                scroll.current?.scrollTo({ x: index * STEP, animated: true });
              }}
              style={[styles.number, index === selected && styles.selected]}>
              <Text style={styles.text}>{index + 1}</Text>
            </Pressable>
          </View>
        ))}
      </ScrollView>
      {exercises.length > 1 && <Text style={styles.hint}>‹  Swipe between exercises  ›</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  slot: { width: STEP, alignItems: 'center', paddingVertical: 2 },
  number: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  selected: { backgroundColor: colors.checked, borderWidth: 1, borderColor: colors.accent },
  text: { color: colors.text, fontSize: 16, fontWeight: '600' },
  hint: { color: colors.textMuted, fontSize: 11, textAlign: 'center', marginTop: 8 },
});
