import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          created_at: string
          spotify_access_token?: string
          spotify_refresh_token?: string
          spotify_expires_at?: string
        }
        Insert: {
          id?: string
          email: string
          created_at?: string
          spotify_access_token?: string
          spotify_refresh_token?: string
          spotify_expires_at?: string
        }
        Update: {
          id?: string
          email?: string
          created_at?: string
          spotify_access_token?: string
          spotify_refresh_token?: string
          spotify_expires_at?: string
        }
      }
      game_sessions: {
        Row: {
          id: string
          user_id: string
          bingo_card: any
          created_at: string
          completed_at?: string
          winning_pattern?: string
        }
        Insert: {
          id?: string
          user_id: string
          bingo_card: any
          created_at?: string
          completed_at?: string
          winning_pattern?: string
        }
        Update: {
          id?: string
          user_id?: string
          bingo_card?: any
          created_at?: string
          completed_at?: string
          winning_pattern?: string
        }
      }
    }
  }
}