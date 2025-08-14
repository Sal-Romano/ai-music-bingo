const SPOTIFY_CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID!
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET!
const REDIRECT_URI = 'https://bingo.sals.site/api/spotify/callback'

export interface SpotifyTrack {
  id: string
  name: string
  artists: { name: string }[]
  album: { name: string; images: { url: string }[] }
  preview_url: string | null
  external_urls: { spotify: string }
  duration_ms: number
}

export interface SpotifyTokens {
  access_token: string
  refresh_token: string
  expires_in: number
  scope: string
}

export class SpotifyAPI {
  private accessToken: string

  constructor(accessToken: string) {
    this.accessToken = accessToken
  }

  static getAuthUrl(): string {
    const scopes = [
      'user-read-private',
      'user-read-email',
      'streaming',
      'user-read-playback-state',
      'user-modify-playback-state',
      'playlist-read-private',
      'playlist-read-collaborative'
    ].join(' ')

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: SPOTIFY_CLIENT_ID,
      scope: scopes,
      redirect_uri: REDIRECT_URI,
    })

    return `https://accounts.spotify.com/authorize?${params.toString()}`
  }

  static async exchangeCodeForTokens(code: string): Promise<SpotifyTokens> {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')}`
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to exchange code for tokens')
    }

    return response.json()
  }

  static async refreshTokens(refreshToken: string): Promise<SpotifyTokens> {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')}`
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to refresh tokens')
    }

    return response.json()
  }

  async searchTracks(query: string, limit: number = 50): Promise<SpotifyTrack[]> {
    const params = new URLSearchParams({
      q: query,
      type: 'track',
      limit: limit.toString(),
      market: 'US'
    })

    const response = await fetch(`https://api.spotify.com/v1/search?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`
      }
    })

    if (!response.ok) {
      throw new Error('Failed to search tracks')
    }

    const data = await response.json()
    return data.tracks.items
  }

  async getPopularTracks(decades: string[] = ['80s', '90s', '2000s', '2010s', '2020s']): Promise<SpotifyTrack[]> {
    const allTracks: SpotifyTrack[] = []
    
    for (const decade of decades) {
      const queries = [
        `year:${this.getYearRange(decade)} genre:pop`,
        `year:${this.getYearRange(decade)} genre:rock`,
        `year:${this.getYearRange(decade)} genre:hip-hop`,
        `year:${this.getYearRange(decade)} genre:r&b`,
      ]
      
      for (const query of queries) {
        try {
          const tracks = await this.searchTracks(query, 25)
          allTracks.push(...tracks)
        } catch (error) {
          console.error(`Error fetching tracks for ${query}:`, error)
        }
      }
    }

    // Remove duplicates and return shuffled tracks
    const uniqueTracks = allTracks.filter((track, index, self) => 
      index === self.findIndex(t => t.id === track.id)
    )
    
    return this.shuffleArray(uniqueTracks)
  }

  private getYearRange(decade: string): string {
    switch (decade) {
      case '80s': return '1980-1989'
      case '90s': return '1990-1999'
      case '2000s': return '2000-2009'
      case '2010s': return '2010-2019'
      case '2020s': return '2020-2024'
      default: return '1980-2024'
    }
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  async startPlayback(deviceId: string, trackUris: string[], position: number = 0): Promise<void> {
    const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        uris: trackUris,
        position_ms: position * 1000 // Convert to milliseconds
      })
    })

    if (!response.ok) {
      throw new Error('Failed to start playback')
    }
  }

  async pausePlayback(): Promise<void> {
    const response = await fetch('https://api.spotify.com/v1/me/player/pause', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`
      }
    })

    if (!response.ok) {
      throw new Error('Failed to pause playback')
    }
  }
}