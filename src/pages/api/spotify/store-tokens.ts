import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { user_id, access_token, refresh_token, expires_at, scope } = req.body

  if (!user_id || !access_token || !refresh_token || !expires_at || !scope) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  try {
    // Create Supabase client with service role permissions (bypasses RLS)
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLIC_KEY!
    )

    // Store tokens in database
    const { error: dbError } = await supabase
      .from('user_spotify_tokens')
      .upsert({
        user_id,
        access_token,
        refresh_token,
        expires_at,
        scope,
      })

    if (dbError) {
      console.error('Database error:', dbError)
      return res.status(500).json({ error: 'Failed to store tokens', details: dbError })
    }

    res.status(200).json({ success: true })

  } catch (error) {
    console.error('Error storing Spotify tokens:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}