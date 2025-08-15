import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { BingoGenerator } from '@/lib/bingoGenerator'
import { SpotifyAPI } from '@/lib/spotify'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get user ID from request body (we'll send it from client)
    const { user_id } = req.body
    
    if (!user_id) {
      return res.status(401).json({ error: 'User ID required' })
    }

    // Get Supabase client
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    )

    // Get user's Spotify tokens
    const { data: tokenData, error: tokenError } = await supabase
      .from('user_spotify_tokens')
      .select('*')
      .eq('user_id', user_id)
      .single()

    if (tokenError || !tokenData) {
      return res.status(400).json({ error: 'Spotify not connected' })
    }

    // Check if token is expired
    const expiresAt = new Date(tokenData.expires_at)
    const now = new Date()
    
    let accessToken = tokenData.access_token

    if (expiresAt <= now) {
      // Refresh the token
      try {
        const newTokens = await SpotifyAPI.refreshTokens(tokenData.refresh_token)
        const newExpiresAt = new Date(Date.now() + newTokens.expires_in * 1000).toISOString()
        
        // Update tokens in database
        await supabase
          .from('user_spotify_tokens')
          .update({
            access_token: newTokens.access_token,
            expires_at: newExpiresAt,
            ...(newTokens.refresh_token && { refresh_token: newTokens.refresh_token })
          })
          .eq('user_id', user_id)
          
        accessToken = newTokens.access_token
      } catch (refreshError) {
        console.error('Error refreshing token:', refreshError)
        return res.status(400).json({ error: 'Failed to refresh Spotify token' })
      }
    }

    // Generate bingo card
    const generator = new BingoGenerator(accessToken)
    const bingoCard = await generator.generateBingoCard()

    // Save game session to database
    const { data: gameSession, error: gameError } = await supabase
      .from('game_sessions')
      .insert({
        user_id: user_id,
        bingo_card: bingoCard,
      })
      .select()
      .single()

    if (gameError) {
      console.error('Error saving game session:', gameError)
      return res.status(500).json({ error: 'Failed to save game session' })
    }

    res.status(200).json({ 
      success: true, 
      bingoCard,
      gameSessionId: gameSession.id 
    })

  } catch (error) {
    console.error('Error generating bingo card:', error)
    res.status(500).json({ error: 'Failed to generate bingo card' })
  }
}