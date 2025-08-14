import { NextApiRequest, NextApiResponse } from 'next'
import { SpotifyAPI } from '@/lib/spotify'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const authUrl = SpotifyAPI.getAuthUrl()
  res.redirect(authUrl)
}