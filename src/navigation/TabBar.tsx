import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { colors, radius, typography } from '@/design/tokens';
import { useRealm } from '@/context/RealmContext';

const TAB_ICONS: Record<string, string> = {
  Today: '◎',
  Evidence: '◆',
  Oath: '',
  Memory: '◇',
  Vault: '◈',
};

const TAB_LABELS: Record<string, string> = {
  Today: 'Today',
  Evidence: 'Evidence',
  Oath: '',
  Memory: 'Memory',
  Vault: 'Vault',
};

export function TabBar({ state, navigation }: BottomTabBarProps) {
  const { realm } = useRealm();
  const insets = useSafeAreaInsets();
  const orbScale = useRef(new Animated.Value(1)).current;
  const orbGlow = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(orbScale, { toValue: 1.07, duration: 2600, useNativeDriver: true }),
        Animated.timing(orbScale, { toValue: 1, duration: 2600, useNativeDriver: true }),
      ]),
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(orbGlow, { toValue: 1, duration: 2200, useNativeDriver: true }),
        Animated.timing(orbGlow, { toValue: 0.4, duration: 2200, useNativeDriver: true }),
      ]),
    ).start();
    return () => {
      orbScale.stopAnimation();
      orbGlow.stopAnimation();
    };
  }, [orbScale, orbGlow]);

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <BlurView intensity={40} tint="dark" style={styles.blur}>
        <View style={[styles.bar, { borderTopColor: 'rgba(255,255,255,0.05)' }]}>
          {state.routes.map((route, index) => {
            const isActive = state.index === index;
            const isOath = route.name === 'Oath';

            const onPress = () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!isActive && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            if (isOath) {
              return (
                <View key={route.key} style={styles.oathWrapper}>
                  <TouchableOpacity
                    onPress={onPress}
                    activeOpacity={0.85}
                    style={styles.oathTouchable}
                  >
                    {/* Outer atmospheric glow */}
                    <Animated.View
                      style={[
                        styles.oathGlow,
                        {
                          backgroundColor: realm.accentMuted,
                          opacity: orbGlow,
                        },
                      ]}
                    />
                    {/* Orb button */}
                    <Animated.View
                      style={[styles.oathButton, { transform: [{ scale: orbScale }] }]}
                    >
                      <LinearGradient
                        colors={realm.orbColors as [string, string, string, string]}
                        start={{ x: 0.3, y: 0 }}
                        end={{ x: 0.7, y: 1 }}
                        style={styles.oathGradient}
                      />
                      {/* Specular */}
                      <View style={styles.oathHighlight} />
                    </Animated.View>
                    <Text style={[styles.oathLabel, { color: realm.accentSoft }]}>OATH</Text>
                  </TouchableOpacity>
                </View>
              );
            }

            return (
              <TouchableOpacity
                key={route.key}
                onPress={onPress}
                activeOpacity={0.7}
                style={styles.tab}
              >
                <Text
                  style={[
                    styles.icon,
                    {
                      color: isActive ? realm.accent : 'rgba(255,255,255,0.18)',
                      fontSize: isActive ? 17 : 15,
                    },
                  ]}
                >
                  {TAB_ICONS[route.name]}
                </Text>
                {isActive && (
                  <View style={[styles.activeDot, { backgroundColor: realm.accent }]} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  blur: {
    overflow: 'hidden',
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
    paddingHorizontal: 8,
    minHeight: 52,
    backgroundColor: 'rgba(4,5,10,0.35)',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    position: 'relative',
  },
  icon: {
    lineHeight: 20,
  },
  activeDot: {
    position: 'absolute',
    bottom: -5,
    width: 3,
    height: 3,
    borderRadius: radius.full,
  },

  // OATH center button
  oathWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: -18,
  },
  oathTouchable: {
    alignItems: 'center',
    gap: 5,
  },
  oathGlow: {
    position: 'absolute',
    top: -6,
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  oathButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: '#4D8CFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 14,
    elevation: 10,
  },
  oathGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  oathHighlight: {
    position: 'absolute',
    top: '15%',
    left: '22%',
    width: '28%',
    height: '28%',
    borderRadius: 99,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  oathLabel: {
    ...typography.labelSm,
    fontSize: 10,
    letterSpacing: 1.5,
  },
});
