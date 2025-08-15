# AI Music Bingo - Game Logic & Rules

## Bingo Card Generation
- **Grid Size**: 5x5 grid (25 cells total)
- **Free Space**: Center cell (index 12) is always "FREE"
- **Track Selection**: 24 unique tracks from Spotify catalog
- **AI Curation**: Mix tracks from different decades (80s, 90s, 2000s, 2010s, 2020s)
- **Genre Diversity**: Include pop, rock, hip-hop, R&B, electronic
- **Cell Format**: "Artist - Song Title" (cleaned of remix/featuring info)

## Winning Patterns
Valid winning patterns include:
- **Rows**: Any complete horizontal line (5 patterns)
- **Columns**: Any complete vertical line (5 patterns)  
- **Diagonals**: Main diagonal or anti-diagonal (2 patterns)
- **Four Corners**: All four corner cells (1 pattern)

## Game Session Management
- **Session Creation**: Generate unique session ID for each game
- **State Persistence**: Save stamped cells, current song, completion status
- **Real-time Updates**: Sync game state across devices if needed
- **Win Detection**: Check patterns after each cell stamp
- **Completion Tracking**: Record winning pattern and timestamp

## Music Playback Rules
- **Song Duration**: 30 seconds per track during auto-play
- **Starting Position**: Begin at 30% through each song for better recognition
- **Volume Management**: Fade in/out between tracks for smooth transitions
- **Manual Controls**: Allow skip forward/backward during gameplay
- **Device Requirements**: Spotify Premium account with active device

## Scoring & Statistics
- **Completion Time**: Track how long it takes to complete a card
- **Accuracy**: Monitor false positive stamps (optional future feature)
- **Streak Tracking**: Count consecutive wins (optional future feature)
- **Favorite Genres**: Analyze user preferences from stamped songs

## Game States
1. **Setup**: User authentication and Spotify connection
2. **Card Generation**: AI creates personalized bingo card
3. **Device Selection**: Choose Spotify playback device
4. **Active Gameplay**: Music plays, user stamps matching cells
5. **Win Condition**: Pattern detected, game completion
6. **Post-Game**: Show results, offer replay option

## Error Handling
- **Network Issues**: Graceful degradation with cached data
- **Spotify Errors**: Clear error messages and recovery options
- **Invalid Stamps**: Allow unstamping of incorrectly marked cells
- **Device Disconnection**: Pause game and prompt for new device
- **Token Expiry**: Automatic refresh or re-authentication prompt

## Accessibility Features
- **Screen Reader**: Proper ARIA labels for all interactive elements
- **High Contrast**: Support for high contrast mode
- **Font Scaling**: Respect system font size preferences
- **Haptic Feedback**: Tactile feedback for cell stamps on mobile
- **Audio Cues**: Optional audio feedback for actions