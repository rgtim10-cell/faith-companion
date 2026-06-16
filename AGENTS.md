# OATH

React Native mobile app built with Expo SDK 56. This is a mobile-first native app — NOT a web app.

- `npm run start` or `expo start` — start Expo dev server
- `expo start --ios` — open on iOS simulator
- `expo start --android` — open on Android emulator

## Stack

- Expo SDK ~56.0.5 with React Native 0.85.3
- React Navigation v7 (Bottom Tabs + Native Stack)
- expo-blur, expo-linear-gradient, expo-haptics
- react-native-svg (for ProgressArc)
- react-native-safe-area-context, react-native-screens

## Structure

```
App.tsx                    — Root (NavigationContainer + providers)
index.ts                   — Expo entry (registerRootComponent)
src/
  design/tokens.ts         — Color, spacing, typography constants
  design/realms.ts         — 4 realm theme configs
  types/index.ts           — Shared TypeScript types
  data/mock.ts             — Placeholder data
  context/RealmContext.tsx — Active realm state (presence/future_self/mission_control/alignment)
  components/
    ui/OathOrb.tsx         — Animated living orb (the AI presence)
    ui/GlassCard.tsx       — Frosted glass card (expo-blur)
    ui/AIInsight.tsx       — OATH insight banner (appears on every screen)
    ui/ProgressArc.tsx     — SVG circular progress ring
    ui/MissionCard.tsx     — Mission list item
    ui/StatCard.tsx        — Momentum stat card
    ui/Badge.tsx           — Status pill
    ui/MemoryCard.tsx      — OATH memory / vault card
    ui/Button.tsx          — Styled button
    ui/SectionHeader.tsx   — Section title row
    layout/RealmBackground.tsx — Ambient gradient bg per realm
    layout/ScreenWrapper.tsx   — Safe area + scroll wrapper
  navigation/
    TabBar.tsx             — Custom bottom tab bar (center OATH orb button)
    RootNavigator.tsx      — Stack + Tab navigator setup
  screens/
    TodayScreen.tsx
    MissionsScreen.tsx
    OathScreen.tsx         — Center tab: orb + oath + memories + realm switcher
    MomentumScreen.tsx
    VaultScreen.tsx
    NightReflectionScreen.tsx — Modal
```

## Core principle

The AI is the app. Every screen contains OATH presence (AIInsight component).
