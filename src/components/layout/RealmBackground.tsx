import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRealm } from '@/context/RealmContext';

export function RealmBackground() {
  const { realm } = useRealm();

  return (
    <View style={[styles.container, { backgroundColor: realm.bg }]}>
      {/* Top atmosphere radial */}
      <LinearGradient
        colors={realm.gradientColors as [string, string, string]}
        locations={[0, 0.45, 1]}
        style={styles.topGradient}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      {/* Subtle bottom vignette */}
      <LinearGradient
        colors={['rgba(0,0,0,0)', realm.bg]}
        style={styles.bottomGradient}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '55%',
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '30%',
  },
});
