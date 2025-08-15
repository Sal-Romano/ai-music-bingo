import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { User } from '@supabase/supabase-js';
import BingoGame from './BingoGame';

interface PlayScreenProps {
  user: User;
}

export default function PlayScreen({ user }: PlayScreenProps) {
  const [gameStarted, setGameStarted] = useState(false);

  const startGame = () => {
    setGameStarted(true);
  };

  const backToMenu = () => {
    setGameStarted(false);
  };

  // Show the game if started
  if (gameStarted) {
    return (
      <View style={styles.container}>
        <View style={styles.gameHeader}>
          <TouchableOpacity style={styles.backButton} onPress={backToMenu}>
            <Text style={styles.backButtonText}>← Back to Menu</Text>
          </TouchableOpacity>
        </View>
        <BingoGame user={user} />
      </View>
    );
  }

  // Show main play menu - always show, regardless of Spotify status
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Text style={styles.title}>🎮 Play</Text>
        <Text style={styles.subtitle}>
          AI Music Bingo - Tap songs when you hear them!
        </Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.welcomeText}>
          Welcome, {user.email?.split('@')[0]}!
        </Text>
        
        <View style={styles.card}>
          <Text style={styles.cardIcon}>🎯</Text>
          <Text style={styles.cardTitle}>AI Music Bingo</Text>
          <Text style={styles.cardText}>
            Generate a personalized bingo card with AI-curated music challenges. Connect Spotify in Settings for real music playback!
          </Text>
          
          <TouchableOpacity style={styles.primaryButton} onPress={startGame}>
            <Text style={styles.primaryButtonText}>🎲 Start New Game</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.featuresGrid}>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>🤖</Text>
            <Text style={styles.featureTitle}>AI-Generated</Text>
            <Text style={styles.featureText}>Smart music challenges</Text>
          </View>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>🎧</Text>
            <Text style={styles.featureTitle}>Spotify Premium</Text>
            <Text style={styles.featureText}>Full music control</Text>
          </View>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>📱</Text>
            <Text style={styles.featureTitle}>Mobile Ready</Text>
            <Text style={styles.featureText}>Play anywhere</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100, // Extra space for tab bar
  },

  gameHeader: {
    padding: 20,
    paddingTop: 60, // Account for status bar
  },
  backButton: {
    alignSelf: 'flex-start',
  },
  backButtonText: {
    color: '#22c55e',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#d1d5db',
    textAlign: 'center',
    lineHeight: 22,
  },
  content: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 20,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#1f2937',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  cardIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
  },
  cardText: {
    fontSize: 16,
    color: '#d1d5db',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  primaryButton: {
    backgroundColor: '#22c55e',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    width: '100%',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  featuresGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  feature: {
    alignItems: 'center',
    flex: 1,
  },
  featureIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  featureText: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
  },

});