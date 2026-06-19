import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { RealmProvider } from '@/context/RealmContext';
import { CovenantProvider } from '@/context/CovenantContext';
import { IdentityProvider } from '@/context/IdentityContext';
import { DailyProvider } from '@/context/DailyContext';
import { TheaterProvider } from '@/context/TheaterContext';
import { InterventionProvider } from '@/context/InterventionContext';
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
  // Skia is native-only here. On web, SkiaOrb and MemorySky resolve to their
  // .web.tsx fallbacks (react-native-svg), so CanvasKit (WASM) is never loaded
  // and there is no WASM bootstrap to wait on.
  return (
    <SafeAreaProvider>
      <RealmProvider>
        <CovenantProvider>
          <IdentityProvider>
            <DailyProvider>
              <TheaterProvider>
                <InterventionProvider>
                  <NavigationContainer theme={navTheme}>
                    <StatusBar style="light" />
                    <RootNavigator />
                  </NavigationContainer>
                </InterventionProvider>
              </TheaterProvider>
            </DailyProvider>
          </IdentityProvider>
        </CovenantProvider>
      </RealmProvider>
    </SafeAreaProvider>
  );
}
