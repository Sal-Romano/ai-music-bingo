import { NextApiRequest, NextApiResponse } from 'next'
import { SpotifyAPI } from '@/lib/spotify'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { code, error, state } = req.query

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
    
    // If we have a state parameter (user ID from mobile), store tokens directly
    if (state && typeof state === 'string') {
      // This is from mobile app - store tokens directly and show success page
      const userId = state;
      const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();
      
      // Store tokens directly using the store-tokens API logic
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_ANON_KEY!
      );

      const { error: dbError } = await supabase
        .from('user_spotify_tokens')
        .upsert({
          user_id: userId,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_at: expiresAt,
          scope: tokens.scope,
        });

      if (dbError) {
        console.error('Database error:', dbError);
        return res.redirect('/?error=failed_to_store_tokens');
      }

      // Show success page for mobile users
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Spotify Connected - AI Music Bingo</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
              color: white;
              margin: 0;
              padding: 20px;
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              text-align: center;
            }
            .container {
              background: #1f2937;
              padding: 40px;
              border-radius: 16px;
              max-width: 400px;
              width: 100%;
            }
            .icon { font-size: 64px; margin-bottom: 20px; }
            .title { font-size: 24px; font-weight: bold; margin-bottom: 16px; color: #22c55e; }
            .message { font-size: 16px; line-height: 1.5; margin-bottom: 24px; color: #d1d5db; }
            .button {
              background: #22c55e;
              color: white;
              border: none;
              padding: 12px 24px;
              border-radius: 8px;
              font-size: 16px;
              font-weight: 600;
              cursor: pointer;
              text-decoration: none;
              display: inline-block;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="icon">🎉</div>
            <div class="title">Spotify Connected!</div>
            <div class="message">
              Your Spotify Premium account has been successfully connected to AI Music Bingo.
              <br><br>
              You can now return to the app and start playing!
            </div>
            <a href="#" onclick="window.close()" class="button">Return to App</a>
          </div>
        </body>
        </html>
      `);
    }
    
    // Regular web flow - redirect to client-side page that will handle storing the tokens
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