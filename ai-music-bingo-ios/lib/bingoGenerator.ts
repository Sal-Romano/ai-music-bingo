import { SpotifyAPI, SpotifyTrack } from './spotify';

export interface BingoCell {
  id: string;
  text: string;
  track?: SpotifyTrack;
  isFree?: boolean;
}

export interface BingoCard {
  id: string;
  cells: BingoCell[];
  tracks: SpotifyTrack[];
}

export class BingoGenerator {
  private spotifyAPI: SpotifyAPI;

  constructor(accessToken: string) {
    this.spotifyAPI = new SpotifyAPI(accessToken);
  }

  async generateBingoCard(): Promise<BingoCard> {
    // Get popular tracks from different decades
    const allTracks = await this.spotifyAPI.getPopularTracks();
    
    if (allTracks.length < 24) {
      throw new Error('Not enough tracks found to generate bingo card');
    }

    // Select 24 tracks (center is FREE)
    const selectedTracks = allTracks.slice(0, 24);
    const cells: BingoCell[] = [];

    // Create bingo cells with artist - song format
    for (let i = 0; i < 25; i++) {
      if (i === 12) { // Center cell is FREE
        cells.push({
          id: `cell-${i}`,
          text: 'FREE',
          isFree: true
        });
      } else {
        const trackIndex = i < 12 ? i : i - 1; // Adjust for FREE cell
        const track = selectedTracks[trackIndex];
        
        // Use the actual "ARTIST - SONG" format for clarity
        const artistName = track.artists[0].name;
        const songName = this.cleanSongName(track.name);
        const category = `${artistName} - ${songName}`;
        
        cells.push({
          id: `cell-${i}`,
          text: category,
          track: track
        });
      }
    }

    return {
      id: `bingo-${Date.now()}`,
      cells,
      tracks: selectedTracks
    };
  }

  private cleanSongName(songName: string): string {
    // Remove common suffixes that make the name too long or confusing
    let cleaned = songName;
    
    // Remove featuring/feat information
    cleaned = cleaned.replace(/\s*\(feat\..*?\)/gi, '');
    cleaned = cleaned.replace(/\s*\(featuring.*?\)/gi, '');
    cleaned = cleaned.replace(/\s*feat\..*$/gi, '');
    
    // Remove remix/version information  
    cleaned = cleaned.replace(/\s*\([^)]*remix[^)]*\)/gi, '');
    cleaned = cleaned.replace(/\s*\([^)]*version[^)]*\)/gi, '');
    cleaned = cleaned.replace(/\s*\([^)]*edit[^)]*\)/gi, '');
    
    // Remove remaster information
    cleaned = cleaned.replace(/\s*\([^)]*remaster[^)]*\)/gi, '');
    
    // Trim whitespace
    cleaned = cleaned.trim();
    
    return cleaned;
  }

  // Winning pattern detection
  static checkWinningPattern(stampedCells: number[]): string | null {
    const winningPatterns = [
      // Rows
      [0, 1, 2, 3, 4], [5, 6, 7, 8, 9], [10, 11, 12, 13, 14], [15, 16, 17, 18, 19], [20, 21, 22, 23, 24],
      // Columns  
      [0, 5, 10, 15, 20], [1, 6, 11, 16, 21], [2, 7, 12, 17, 22], [3, 8, 13, 18, 23], [4, 9, 14, 19, 24],
      // Diagonals
      [0, 6, 12, 18, 24], [4, 8, 12, 16, 20],
      // Four corners
      [0, 4, 20, 24],
    ];

    const patternNames = [
      'Top Row', 'Second Row', 'Third Row', 'Fourth Row', 'Bottom Row',
      'Left Column', 'Second Column', 'Third Column', 'Fourth Column', 'Right Column', 
      'Main Diagonal', 'Anti Diagonal',
      'Four Corners',
    ];

    for (let i = 0; i < winningPatterns.length; i++) {
      const pattern = winningPatterns[i];
      const isWinning = pattern.every(cell => 
        cell === 12 || stampedCells.includes(cell) // Center (12) is always "stamped"
      );
      
      if (isWinning) {
        return patternNames[i];
      }
    }

    return null;
  }
}