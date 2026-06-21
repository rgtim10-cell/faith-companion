import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { StarDatum } from './memorySkyLayout';

// Invisible touch targets laid over the constellation. Skia-free and plain RN,
// so native and web behave identically. Tapping a star surfaces that memory —
// no card, no modal. The sky itself is the interface.
//
// On a dense sky we only make the most significant stars tappable: the small,
// faded rim stars are atmosphere, not destinations — and it keeps the overlay
// light when there are hundreds of memories.
export function StarTouchLayer({
  stars,
  onSelect,
  max = 80,
}: {
  stars: StarDatum[];
  onSelect: (id: string) => void;
  max?: number;
}) {
  const targets = React.useMemo(() => {
    const memoryStars = stars.filter((s) => !s.isNorthStar);
    if (memoryStars.length <= max) return memoryStars;
    return [...memoryStars]
      .sort((a, b) => b.significance - a.significance)
      .slice(0, max);
  }, [stars, max]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {targets.map((s) => {
        // Larger, brighter stars get a larger touch radius — proportional to
        // their pull, but always comfortably tappable.
        const hit = Math.max(22, s.r * 6);
        return (
          <Pressable
            key={s.id}
            onPress={() => onSelect(s.id)}
            style={{
              position: 'absolute',
              left: s.cx - hit / 2,
              top: s.cy - hit / 2,
              width: hit,
              height: hit,
              borderRadius: hit / 2,
            }}
          />
        );
      })}
    </View>
  );
}

export default StarTouchLayer;
