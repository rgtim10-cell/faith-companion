import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RealmBackground } from './RealmBackground';
import { spacing } from '@/design/tokens';

interface ScreenWrapperProps {
  children: React.ReactNode;
  scrollable?: boolean;
  centered?: boolean;
  style?: object;
}

export function ScreenWrapper({
  children,
  scrollable = true,
  centered = false,
  style,
}: ScreenWrapperProps) {
  const insets = useSafeAreaInsets();

  const contentStyle = {
    paddingTop: insets.top + spacing.md,
    paddingBottom: insets.bottom + 100, // bottom nav height
    paddingHorizontal: spacing.lg,
    ...(centered && { alignItems: 'center' as const, justifyContent: 'center' as const }),
  };

  if (!scrollable) {
    return (
      <View style={styles.container}>
        <RealmBackground />
        <View style={[contentStyle, styles.fill, style]}>{children}</View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <RealmBackground />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[contentStyle, style]}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  fill: {
    flex: 1,
  },
});
