import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { User } from '@supabase/supabase-js';
import * as Haptics from 'expo-haptics';
import { supabase } from '../lib/supabase';
import { BingoGenerator } from '../lib/bingoGenerator';
import { SpotifyTrack } from '../lib/spotify';
import SpotifyPlayer from './SpotifyPlayer';

interface BingoCell {
  id: string;
  text: string;
  track?: SpotifyTrack;
  isFree?: boolean;
}

interface BingoCard {
  id: string;
  cells: BingoCell[];
  tracks?: SpotifyTrack[];
}

interface BingoGameProps {
  user: User;
}

// Demo bingo card data
const createDemoBingoCard = (): BingoCard => {
  const demoSongs = [
    'Taylor Swift - Shake It Off',
    'Ed Sheeran - Shape of You',
    'Billie Eilish - Bad Guy',
    'The Weeknd - Blinding Lights',
    'Dua Lipa - Levitating',
    'Harry Styles - As It Was',
    'Olivia Rodrigo - Good 4 U',
    'Post Malone - Circles',
    'Ariana Grande - 7 rings',
    'Drake - God\'s Plan',
    'Bruno Mars - Uptown Funk',
    'Adele - Rolling in the Deep',
    'Imagine Dragons - Believer',
    'Maroon 5 - Sugar',
    'Justin Bieber - Sorry',
    'Rihanna - Umbrella',
    'Katy Perry - Roar',
    'Lady Gaga - Bad Romance',
    'Beyoncé - Single Ladies',
    'Eminem - Lose Yourself',
    'Coldplay - Viva La Vida',
    'OneRepublic - Counting Stars',
    'Sia - Chandelier',
    'Sam Smith - Stay With Me',
  ];

  const cells: BingoCell[] = [];
  
  for (let i = 0; i < 25; i++) {
    if (i === 12) { // Center cell is FREE
      cells.push({
        id: `cell-${i}`,
        text: 'FREE',
        isFree: true
      });
    } else {
      const songIndex = i < 12 ? i : i - 1;
      cells.push({
        id: `cell-${i}`,
        text: demoSongs[songIndex]
      });
    }
  }

  return {
    id: `bingo-${Date.now()}`,
    cells
  };
};

export default function BingoGame({ user }: BingoGameProps) {
  const [bingoCard, setBingoCard] = useState<BingoCard | null>(null);
  const [stampedCells, setStampedCells] = useState<number[]>([]);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [winningPattern, setWinningPattern] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [spotifyTokens, setSpotifyTokens] = useState<any>(null);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);

  useEffect(() => {
    checkSpotifyTokens();
  }, [user]);

  const checkSpotifyTokens = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('user_spotify_tokens')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!error && data) {
      const isExpired = new Date(data.expires_at) < new Date();
      if (!isExpired) {
        setSpotifyTokens(data);
      }
    }
  };

  const generateNewGame = async () => {
    setLoading(true);
    
    try {
      let newCard: BingoCard;
      
      if (spotifyTokens) {
        // Generate real bingo card with Spotify data
        const bingoGenerator = new BingoGenerator(spotifyTokens.access_token);
        newCard = await bingoGenerator.generateBingoCard();
      } else {
        // Fallback to demo card
        newCard = createDemoBingoCard();
      }
      
      setBingoCard(newCard);
      setStampedCells([]);
      setGameCompleted(false);
      setWinningPattern(null);
    } catch (error) {
      console.error('Error generating bingo card:', error);
      Alert.alert('Error', 'Failed to generate bingo card. Using demo card instead.');
      // Fallback to demo card
      const newCard = createDemoBingoCard();
      setBingoCard(newCard);
      setStampedCells([]);
      setGameCompleted(false);
      setWinningPattern(null);
    } finally {
      setLoading(false);
    }
  };

  const checkWinningPattern = useCallback((stampedCells: number[]): string | null => {
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
  }, []);

  const handleCellStamp = useCallback((cellIndex: number) => {
    if (gameCompleted) return;

    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const newStampedCells = stampedCells.includes(cellIndex)
      ? stampedCells.filter(i => i !== cellIndex) // Remove stamp
      : [...stampedCells, cellIndex]; // Add stamp

    setStampedCells(newStampedCells);

    // Check for winning pattern
    const pattern = BingoGenerator.checkWinningPattern(newStampedCells);
    if (pattern) {
      setWinningPattern(pattern);
      setGameCompleted(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('🎉 BINGO! 🎉', `Congratulations! You got ${pattern}!`);
    }
  }, [stampedCells, gameCompleted, checkWinningPattern]);

  const handleSongChange = useCallback((newSongIndex: number) => {
    setCurrentSongIndex(newSongIndex);
  }, []);

  const isStamped = useCallback((cellIndex: number) => {
    return cellIndex === 12 || stampedCells.includes(cellIndex); // Center is always stamped
  }, [stampedCells]);

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.icon}>🤖</Text>
          <View style={styles.alert}>
            <Text style={styles.alertTitle}>🎵 Creating Your Bingo Card</Text>
            <Text style={styles.alertText}>AI is generating personalized music challenges...</Text>
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#22c55e" />
            <Text style={styles.loadingText}>This may take a moment</Text>
          </View>
        </View>
      </View>
    );
  }

  if (!bingoCard) {
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.icon}>🎯</Text>
          <Text style={styles.title}>Ready to Play!</Text>
          <View style={styles.alert}>
            <Text style={styles.alertTitle}>🎵 AI Music Bingo</Text>
            <Text style={styles.alertText}>
              Generate a personalized bingo card with AI-curated music challenges
            </Text>
          </View>
          <TouchableOpacity style={styles.primaryButton} onPress={generateNewGame}>
            <Text style={styles.primaryButtonText}>🎲 Generate Bingo Card</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Text style={styles.gameTitle}>🎵 Music Bingo Card</Text>
        
        {winningPattern && (
          <View style={styles.winAlert}>
            <Text style={styles.winTitle}>🎉 BINGO! 🎉</Text>
            <Text style={styles.winPattern}>{winningPattern}</Text>
            <Text style={styles.winText}>Congratulations! You won!</Text>
          </View>
        )}
      </View>

      <View style={styles.bingoGrid}>
        {bingoCard.cells.map((cell, index) => (
          <TouchableOpacity
            key={cell.id}
            style={[
              styles.bingoCell,
              isStamped(index) && styles.stampedCell,
              cell.isFree && styles.freeCell,
            ]}
            onPress={() => handleCellStamp(index)}
            disabled={cell.isFree}
          >
            <Text style={[
              styles.cellText,
              isStamped(index) && styles.stampedText,
              cell.isFree && styles.freeText,
            ]}>
              {cell.text}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.stats}>
        <View style={styles.statsContainer}>
          <Text style={styles.statsText}>✅ Stamped: {stampedCells.length}</Text>
          <Text style={styles.statsText}>•</Text>
          <Text style={styles.statsText}>⏳ Remaining: {24 - stampedCells.length}</Text>
        </View>
        
        <Text style={styles.instructions}>
          Tap cells when you hear matching songs! 
          {!gameCompleted && " Get 5 in a row to win!"}
        </Text>
      </View>

      {/* Spotify Player - only show if we have real tracks */}
      {bingoCard.tracks && bingoCard.tracks.length > 0 && (
        <SpotifyPlayer
          user={user}
          tracks={bingoCard.tracks}
          currentSongIndex={currentSongIndex}
          onSongChange={handleSongChange}
          gameCompleted={gameCompleted}
        />
      )}

      {gameCompleted && (
        <TouchableOpacity style={styles.playAgainButton} onPress={generateNewGame}>
          <Text style={styles.playAgainText}>🎵 Play Again</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  card: {
    backgroundColor: '#1f2937',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  icon: {
    fontSize: 64,
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 24,
  },
  alert: {
    backgroundColor: '#1e40af',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    width: '100%',
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  alertText: {
    fontSize: 14,
    color: '#ffffff',
    lineHeight: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 16,
  },
  primaryButton: {
    backgroundColor: '#22c55e',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    width: '100%',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  gameTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 24,
  },
  winAlert: {
    backgroundColor: '#059669',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    width: '100%',
  },
  winTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  winPattern: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  winText: {
    fontSize: 14,
    color: '#ffffff',
  },
  bingoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 32,
  },
  bingoCell: {
    width: '18%',
    aspectRatio: 1,
    backgroundColor: '#374151',
    borderRadius: 8,
    margin: '1%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
    borderWidth: 2,
    borderColor: '#4b5563',
  },
  stampedCell: {
    backgroundColor: '#22c55e',
    borderColor: '#16a34a',
  },
  freeCell: {
    backgroundColor: '#7c3aed',
    borderColor: '#6d28d9',
  },
  cellText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 12,
  },
  stampedText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  freeText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  stats: {
    alignItems: 'center',
    marginBottom: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    marginBottom: 16,
    gap: 16,
  },
  statsText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '500',
  },
  instructions: {
    color: '#9ca3af',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  playAgainButton: {
    backgroundColor: '#22c55e',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  playAgainText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
});