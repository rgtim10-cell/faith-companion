# Faith Companion

A modern, AI-powered faith and prayer companion app built with React Native (Expo).

## Features

- **Prayer Journal** — Write, categorize, and track prayers with answered prayer tracking
- **AI Prayer Assistant** — Get personalized prayers, scripture suggestions, and encouragement
- **Daily Devotionals** — AI-generated devotionals based on your mood and prayer history
- **Mood & Faith Tracking** — Track emotions, stress, gratitude, and spiritual habits
- **Progress Dashboard** — Visual prayer streaks, category breakdown, and weekly activity
- **Voice Prayer Journaling** — Speech-to-text prayer recording (coming soon)
- **Reminder System** — Push notifications for prayer time and devotionals (coming soon)

## Tech Stack

| Layer          | Technology                  |
| -------------- | --------------------------- |
| Frontend       | React Native + Expo (SDK 56)|
| Navigation     | Expo Router (file-based)    |
| Backend        | Supabase                    |
| Database       | PostgreSQL                  |
| AI             | OpenAI API (GPT-4o-mini)    |
| Auth           | Supabase Auth               |
| State          | React Context + useReducer  |
| Styling        | React Native StyleSheet     |

## Project Structure

```
src/
├── app/                    # Expo Router file-based routes
│   ├── _layout.tsx         # Root layout with providers
│   ├── (tabs)/             # Tab navigator
│   │   ├── _layout.tsx     # Tab bar configuration
│   │   ├── index.tsx       # Home screen
│   │   ├── journal.tsx     # Prayer journal
│   │   ├── companion.tsx   # AI companion chat
│   │   ├── devotionals.tsx # Daily devotionals
│   │   └── progress.tsx    # Progress & stats
│   └── prayer/
│       ├── new.tsx         # New prayer modal
│       └── [id].tsx        # Prayer detail
├── components/             # Reusable UI components
├── constants/              # Theme, colors, typography
├── context/                # React Context providers
├── hooks/                  # Custom hooks
├── lib/                    # Supabase client setup
├── services/               # AI service, verse service
└── types/                  # TypeScript type definitions

supabase/
└── migrations/             # PostgreSQL schema
```

## Getting Started

### Prerequisites

- Node.js ≥ 22.13
- Expo CLI
- Supabase project (for backend)
- OpenAI API key (for AI features)

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env` file:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_OPENAI_API_KEY=your-openai-key
```

### Database Setup

Run the migration against your Supabase project:

```bash
supabase db push
```

Or execute `supabase/migrations/001_initial_schema.sql` in the Supabase SQL editor.

### Run the App

```bash
npx expo start
```

- Press `i` for iOS simulator
- Press `a` for Android emulator
- Press `w` for web browser
- Scan QR code with Expo Go for physical device

## Design Philosophy

- **Modern & Premium** — Soft gradients, calming colors, elegant typography
- **Emotionally Comforting** — Warm tones, peaceful UI, gentle interactions
- **AI-Native** — AI assistant that acts as a supportive companion, never as God
- **Simple & Beautiful** — Minimal UI with rounded cards and thoughtful spacing
- **Dark/Light Mode** — Full theme support with system preference detection

## Monetization (Planned)

| Free                | Premium                       |
| ------------------- | ----------------------------- |
| Journaling          | Unlimited AI conversations    |
| Limited AI          | Voice prayer journaling       |
| Basic reminders     | Advanced insights & analytics |
|                     | Personalized devotionals      |

## License

MIT
