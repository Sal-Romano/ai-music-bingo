# AI Music Bingo - Project Overview

## Project Description
AI Music Bingo is a modern take on the classic bingo game, powered by Spotify's music catalog and AI-generated challenges. Players receive personalized bingo cards with music-related prompts and mark them off as they hear matching songs during gameplay.

## Architecture
- **Web App**: Next.js 15 with React 19, TypeScript, Tailwind CSS
- **Mobile App**: React Native with Expo, TypeScript
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **Music Integration**: Spotify Web API with Premium account requirement
- **AI Integration**: Custom bingo card generation with music metadata

## Key Features
- **Authentication**: Email/password via Supabase Auth
- **Spotify Integration**: OAuth flow with token management
- **Real-time Music Playback**: Spotify Web Playback SDK
- **AI-Generated Cards**: Dynamic bingo cards with music challenges
- **Cross-Platform**: Web and iOS mobile apps
- **Game Logic**: Win detection, scoring, session management

## Technology Stack
- **Frontend**: React 19, TypeScript, Tailwind CSS
- **Mobile**: React Native, Expo SDK 53
- **Backend**: Supabase, PostgreSQL
- **APIs**: Spotify Web API, Supabase REST API
- **Build Tools**: Next.js, Expo CLI, TypeScript compiler
- **Styling**: Tailwind CSS (web), StyleSheet (mobile)

## Environment Variables
```
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_SPOTIFY_CLIENT_ID=your_spotify_client_id
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Development Commands
- **Web Dev**: `npm run dev` (runs on port 5001)
- **Mobile Dev**: `npx expo start` (with tunnel for device testing)
- **Build Web**: `npm run build`
- **Build Mobile**: `eas build --platform ios`