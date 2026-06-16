import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { RealmProvider } from '@/context/RealmContext';
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
  return (
    <SafeAreaProvider>
      <RealmProvider>
        <NavigationContainer theme={navTheme}>
          <StatusBar style="light" />
          <RootNavigator />
        </NavigationContainer>
      </RealmProvider>
    </SafeAreaProvider>
  );
}
