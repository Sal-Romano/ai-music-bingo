import { NextApiRequest, NextApiResponse } from 'next'
import { SpotifyAPI } from '@/lib/spotify'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { code, error } = req.query

  if (error) {
    console.error('Spotify auth error:', error)
    return res.redirect('/?error=spotify_auth_failed')
  }

  if (!code || typeof code !== 'string') {
    return res.redirect('/?error=no_code')
  }

  try {
    // Exchange code for tokens
    const tokens = await SpotifyAPI.exchangeCodeForTokens(code)
    
    // Redirect to a client-side page that will handle storing the tokens
    const tokenParams = new URLSearchParams({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_in: tokens.expires_in.toString(),
      scope: tokens.scope
    })
    
    res.redirect(`/spotify-success?${tokenParams.toString()}`)
    
  } catch (error) {
    console.error('Error in Spotify callback:', error)
    res.redirect('/?error=callback_failed')
  }
}