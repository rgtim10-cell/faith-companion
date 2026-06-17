import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TabBar } from './TabBar';
import { TodayScreen } from '@/screens/TodayScreen';
import { MissionsScreen } from '@/screens/MissionsScreen';
import { OathScreen } from '@/screens/OathScreen';
import { MomentumScreen } from '@/screens/MomentumScreen';
import { VaultScreen } from '@/screens/VaultScreen';
import { NightReflectionScreen } from '@/screens/NightReflectionScreen';
import { CommunionScreen } from '@/screens/CommunionScreen';
import type { RootStackParamList, TabParamList } from '@/types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function TabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Today" component={TodayScreen} />
      <Tab.Screen name="Missions" component={MissionsScreen} />
      <Tab.Screen name="Oath" component={OathScreen} />
      <Tab.Screen name="Momentum" component={MomentumScreen} />
      <Tab.Screen name="Vault" component={VaultScreen} />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={TabNavigator} />
      <Stack.Screen
        name="NightReflection"
        component={NightReflectionScreen}
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen
        name="Communion"
        component={CommunionScreen}
        options={{
          presentation: 'modal',
          animation: 'fade',
          gestureEnabled: false,
        }}
      />
    </Stack.Navigator>
  );
}
