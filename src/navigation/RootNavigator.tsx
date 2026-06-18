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
import { ManifestationCanvas } from '@/screens/ManifestationCanvas';
import { useCovenant } from '@/context/CovenantContext';

export function RootNavigator() {
  const { covenant, isLoading } = useCovenant();

  // Block until storage is checked — avoids Covenant flashing on returning users.
  if (isLoading) return null;

  // First launch: present the Covenant ceremony before the main experience.
  if (!covenant) return <CovenantScreen />;

  // ── One Screen experiment ──────────────────────────────────
  // No tabs. No stack. No destinations. OATH is a single adaptive surface.
  return <ManifestationCanvas />;
}
