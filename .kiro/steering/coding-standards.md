# AI Music Bingo - Coding Standards

## TypeScript Standards
- **Strict Mode**: Always use strict TypeScript configuration
- **Interface Definitions**: Define interfaces for all data structures
- **Type Safety**: Avoid `any` types, use proper type definitions
- **Null Safety**: Handle null/undefined cases explicitly

## React/React Native Standards
- **Functional Components**: Use functional components with hooks
- **Custom Hooks**: Extract reusable logic into custom hooks
- **State Management**: Use useState and useEffect appropriately
- **Memoization**: Use useCallback and useMemo for performance optimization
- **Error Boundaries**: Implement proper error handling

## File Organization
```
src/
├── components/          # Reusable UI components
├── lib/                # Utility libraries and API clients
├── pages/api/          # Next.js API routes (web only)
├── app/                # Next.js app router pages (web only)
└── types/              # TypeScript type definitions

ai-music-bingo-ios/
├── components/         # React Native components
├── lib/               # Shared utilities and API clients
├── app/               # Expo Router app structure
└── assets/            # Static assets
```

## Component Standards
- **Single Responsibility**: Each component should have one clear purpose
- **Props Interface**: Define TypeScript interfaces for all props
- **Default Props**: Use default parameters instead of defaultProps
- **Styling**: Use Tailwind CSS for web, StyleSheet for mobile
- **Accessibility**: Include proper accessibility props and labels

## API Integration Standards
- **Error Handling**: Always handle API errors gracefully
- **Loading States**: Show loading indicators during async operations
- **Type Safety**: Define interfaces for API responses
- **Token Management**: Handle Spotify token refresh automatically
- **Rate Limiting**: Respect Spotify API rate limits

## Database Standards
- **Supabase Client**: Use the shared supabase client instance
- **RLS Policies**: Implement Row Level Security for data protection
- **Type Generation**: Use Supabase CLI to generate TypeScript types
- **Error Handling**: Handle database errors with user-friendly messages

## Mobile-Specific Standards
- **Platform Differences**: Handle iOS/Android differences appropriately
- **Navigation**: Use Expo Router for navigation
- **Permissions**: Request permissions before accessing device features
- **Performance**: Optimize for mobile performance and battery life
- **Offline Support**: Handle network connectivity issues gracefully