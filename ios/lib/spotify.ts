export interface SpotifyTrack {
  id: string;
  name: string;
  artists: { name: string }[];
  album: { name: string; images: { url: string }[] };
  preview_url: string | null;
  external_urls: { spotify: string };
  duration_ms: number;
}

export interface SpotifyTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  scope: string;
}

export class SpotifyAPI {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  async searchTracks(query: string, limit: number = 50): Promise<SpotifyTrack[]> {
    const params = new URLSearchParams({
      q: query,
      type: 'track',
      limit: limit.toString(),
      market: 'US'
    });

    const response = await fetch(`https://api.spotify.com/v1/search?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to search tracks');
    }

    const data = await response.json();
    return data.tracks.items;
  }

  async getPopularTracks(decades: string[] = ['80s', '90s', '2000s', '2010s', '2020s']): Promise<SpotifyTrack[]> {
    const allTracks: SpotifyTrack[] = [];
    
    for (const decade of decades) {
      const queries = [
        `year:${this.getYearRange(decade)} genre:pop`,
        `year:${this.getYearRange(decade)} genre:rock`,
        `year:${this.getYearRange(decade)} genre:hip-hop`,
        `year:${this.getYearRange(decade)} genre:r&b`,
      ];
      
      for (const query of queries) {
        try {
          const tracks = await this.searchTracks(query, 25);
          allTracks.push(...tracks);
        } catch (error) {
          console.error(`Error fetching tracks for ${query}:`, error);
        }
      }
    }

    // Remove duplicates and return shuffled tracks
    const uniqueTracks = allTracks.filter((track, index, self) => 
      index === self.findIndex(t => t.id === track.id)
    );
    
    return this.shuffleArray(uniqueTracks);
  }

  private getYearRange(decade: string): string {
    switch (decade) {
      case '80s': return '1980-1989';
      case '90s': return '1990-1999';
      case '2000s': return '2000-2009';
      case '2010s': return '2010-2019';
      case '2020s': return '2020-2024';
      default: return '1980-2024';
    }
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}