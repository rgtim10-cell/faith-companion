import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { RealmProvider } from '@/context/RealmContext';
import { CovenantProvider } from '@/context/CovenantContext';
import { RootNavigator } from '@/navigation/RootNavigator';

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: 'transparent',
    card: 'transparent',
    border: 'transparent',
  },
};

export default function App() {
  // On web, Skia must load CanvasKit (WASM) before any Skia component renders.
  // The wasm is served locally from /public to avoid any external CDN.
  const [ready, setReady] = useState(Platform.OS !== 'web');

  useEffect(() => {
    if (Platform.OS !== 'web' || ready) return;
    import('@shopify/react-native-skia/lib/module/web')
      .then(({ LoadSkiaWeb }) => LoadSkiaWeb({ locateFile: (file: string) => `/${file}` }))
      .then(() => setReady(true))
      .catch((e) => {
        console.error('Skia web load failed', e);
        setReady(true);
      });
  }, [ready]);

  if (!ready) return null;

  return (
    <SafeAreaProvider>
      <RealmProvider>
        <CovenantProvider>
          <NavigationContainer theme={navTheme}>
            <StatusBar style="light" />
            <RootNavigator />
          </NavigationContainer>
        </CovenantProvider>
      </RealmProvider>
    </SafeAreaProvider>
  );
}
