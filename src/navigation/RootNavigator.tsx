import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TabBar } from './TabBar';
import { TodayScreen } from '@/screens/TodayScreen';
import { EvidenceUploadScreen } from '@/screens/EvidenceUploadScreen';
import { OathScreen } from '@/screens/OathScreen';
import { MemoryGraphScreen } from '@/screens/MemoryGraphScreen';
import { VaultScreen } from '@/screens/VaultScreen';
import { NightReflectionScreen } from '@/screens/NightReflectionScreen';
import { CommunionScreen } from '@/screens/CommunionScreen';
import { CovenantScreen } from '@/screens/CovenantScreen';
import { TheaterScreen } from '@/screens/TheaterScreen';
import { useCovenant } from '@/context/CovenantContext';
import type { RootStackParamList, TabParamList } from '@/types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function TabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false }}
      initialRouteName="Oath"
    >
      <Tab.Screen name="Today" component={TodayScreen} />
      <Tab.Screen name="Evidence" component={EvidenceUploadScreen} />
      <Tab.Screen name="Oath" component={OathScreen} />
      <Tab.Screen name="Memory" component={MemoryGraphScreen} />
      <Tab.Screen name="Vault" component={VaultScreen} />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  const { covenant, isLoading } = useCovenant();

  // Block until storage is checked — avoids Covenant flashing on returning users.
  if (isLoading) return null;

  // First launch: present the Covenant ceremony before the main experience.
  if (!covenant) return <CovenantScreen />;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={TabNavigator} />
      <Stack.Screen
        name="NightReflection"
        component={NightReflectionScreen}
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="Communion"
        component={CommunionScreen}
        options={{ presentation: 'modal', animation: 'fade', gestureEnabled: false }}
      />
      <Stack.Screen
        name="Theater"
        component={TheaterScreen}
        options={{
          presentation: 'fullScreenModal',
          animation: 'fade',
          animationDuration: 900,
          gestureEnabled: false,
        }}
      />
    </Stack.Navigator>
  );
}
