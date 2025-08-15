# AI Music Bingo - Database Schema & Supabase Configuration

## Database Tables

### user_spotify_tokens
Stores Spotify OAuth tokens for each user
```sql
CREATE TABLE user_spotify_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  scope TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### game_sessions
Tracks individual bingo game sessions
```sql
CREATE TABLE game_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  bingo_card JSONB NOT NULL,
  stamped_cells INTEGER[] DEFAULT '{}',
  current_song_index INTEGER DEFAULT 0,
  is_completed BOOLEAN DEFAULT FALSE,
  winning_pattern TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### user_stats (Optional Future Enhancement)
Track user gameplay statistics
```sql
CREATE TABLE user_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  games_played INTEGER DEFAULT 0,
  games_won INTEGER DEFAULT 0,
  total_play_time INTERVAL DEFAULT '0 seconds',
  favorite_genres TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Row Level Security (RLS) Policies

### user_spotify_tokens RLS
```sql
-- Enable RLS
ALTER TABLE user_spotify_tokens ENABLE ROW LEVEL SECURITY;

-- Users can only access their own tokens
CREATE POLICY "Users can view own spotify tokens" ON user_spotify_tokens
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own spotify tokens" ON user_spotify_tokens
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own spotify tokens" ON user_spotify_tokens
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own spotify tokens" ON user_spotify_tokens
  FOR DELETE USING (auth.uid() = user_id);
```

### game_sessions RLS
```sql
-- Enable RLS
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;

-- Users can only access their own game sessions
CREATE POLICY "Users can view own game sessions" ON game_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own game sessions" ON game_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own game sessions" ON game_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own game sessions" ON game_sessions
  FOR DELETE USING (auth.uid() = user_id);
```

## Indexes for Performance
```sql
-- Index for faster token lookups
CREATE INDEX idx_user_spotify_tokens_user_id ON user_spotify_tokens(user_id);
CREATE INDEX idx_user_spotify_tokens_expires_at ON user_spotify_tokens(expires_at);

-- Index for faster game session queries
CREATE INDEX idx_game_sessions_user_id ON game_sessions(user_id);
CREATE INDEX idx_game_sessions_created_at ON game_sessions(created_at DESC);
CREATE INDEX idx_game_sessions_completed ON game_sessions(user_id, is_completed);
```

## Supabase Configuration

### Authentication Settings
- **Email Confirmation**: Enabled for security
- **Password Requirements**: Minimum 6 characters
- **Session Duration**: 24 hours default
- **Refresh Token Rotation**: Enabled for security

### API Settings
- **Auto-generated API**: Enabled for REST endpoints
- **Real-time**: Enabled for live game updates (future feature)
- **GraphQL**: Disabled (not needed for this project)

### Storage (Future Enhancement)
- **Profile Pictures**: User avatar storage
- **Game Screenshots**: Completed bingo card images
- **Audio Clips**: Custom sound effects

## Environment Variables for Supabase
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key (server-side only)
```

## Data Migration Scripts
Store migration scripts in `supabase/migrations/` directory:
- `001_initial_schema.sql` - Create initial tables
- `002_add_rls_policies.sql` - Add Row Level Security
- `003_add_indexes.sql` - Performance indexes
- `004_add_user_stats.sql` - Future statistics table