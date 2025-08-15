# AI Music Bingo - Spotify Integration Guide

## Spotify API Configuration
- **Client ID**: Use environment variable `SPOTIFY_CLIENT_ID`
- **Client Secret**: Server-side only, never expose to client
- **Redirect URI**: `https://bingo.sals.site/api/spotify/callback`
- **Scopes Required**: 
  - `user-read-private` - Access user profile
  - `user-read-email` - Access user email
  - `streaming` - Control Spotify playback
  - `user-read-playback-state` - Read current playback state
  - `user-modify-playback-state` - Control playback
  - `playlist-read-private` - Access private playlists
  - `playlist-read-collaborative` - Access collaborative playlists

## OAuth Flow Implementation
1. **Authorization**: Redirect user to Spotify authorization URL
2. **Callback Handling**: Exchange authorization code for access/refresh tokens
3. **Token Storage**: Store tokens securely in Supabase with user association
4. **Token Refresh**: Automatically refresh expired tokens
5. **State Parameter**: Use user ID as state for mobile app identification

## Token Management
- **Access Token**: Valid for 1 hour, used for API requests
- **Refresh Token**: Long-lived, used to get new access tokens
- **Expiration Handling**: Check token expiry before API calls
- **Automatic Refresh**: Implement background token refresh
- **Error Handling**: Handle token revocation gracefully

## Music Playback Standards
- **Device Selection**: Allow users to choose playback device
- **Volume Control**: Implement fade in/out for better UX
- **Track Position**: Start songs at 30% through for better recognition
- **Auto-progression**: 30 seconds per song during gameplay
- **Error Recovery**: Handle playback errors and device disconnections

## API Rate Limiting
- **Respect Limits**: Spotify allows 100 requests per minute per user
- **Batch Requests**: Combine multiple operations when possible
- **Retry Logic**: Implement exponential backoff for rate limit errors
- **Caching**: Cache track metadata to reduce API calls

## Mobile Considerations
- **Browser OAuth**: Use WebBrowser.openBrowserAsync for OAuth flow
- **Deep Linking**: Handle return from browser to app
- **Background Playback**: Music plays through Spotify app, not our app
- **Device Detection**: Poll for available Spotify devices
- **Network Handling**: Handle offline/poor connectivity scenarios

## Security Best Practices
- **Token Storage**: Store tokens securely in Supabase with RLS
- **HTTPS Only**: All Spotify API calls must use HTTPS
- **State Validation**: Validate state parameter in OAuth callback
- **Token Scope**: Only request necessary scopes
- **User Consent**: Clear communication about required permissions