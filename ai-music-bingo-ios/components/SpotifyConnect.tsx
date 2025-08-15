import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

interface SpotifyTokens {
  access_token: string;
  refresh_token: string;
  expires_at: string;
  scope: string;
}

interface SpotifyConnectProps {
  user: User;
  onConnected: () => void;
}

export default function SpotifyConnect({ user, onConnected }: SpotifyConnectProps) {
  const [spotifyTokens, setSpotifyTokens] = useState<SpotifyTokens | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSpotifyConnection();
  }, [user]);

  const checkSpotifyConnection = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('user_spotify_tokens')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!error && data) {
      setSpotifyTokens(data);
      // Check if token is still valid
      const isExpired = new Date(data.expires_at) < new Date();
      if (!isExpired) {
        onConnected();
      }
    }
    setLoading(false);
  };

  const connectSpotify = async () => {
    try {
      setLoading(true);
      
      // Store user ID for the OAuth callback
      if (user) {
        // We'll use a different approach - pass user ID in the state parameter
        const state = user.id;
        
        const spotifyClientId = process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID;
        const redirectUri = 'https://bingo.sals.site/api/spotify/callback';
        
        const scopes = [
          'user-read-private',
          'user-read-email',
          'streaming',
          'user-read-playback-state',
          'user-modify-playback-state',
          'playlist-read-private',
          'playlist-read-collaborative'
        ].join(' ');

        const authUrl = `https://accounts.spotify.com/authorize?` +
          `response_type=code&` +
          `client_id=${spotifyClientId}&` +
          `scope=${encodeURIComponent(scopes)}&` +
          `redirect_uri=${encodeURIComponent(redirectUri)}&` +
          `state=${encodeURIComponent(state)}`;

        // Open Spotify OAuth in browser
        const result = await WebBrowser.openBrowserAsync(authUrl);
        
        if (result.type === 'opened') {
          // Browser opened successfully - start polling for tokens
          pollForSpotifyConnection();
        } else if (result.type === 'cancel' || result.type === 'dismiss') {
          // User closed browser - check once if they completed auth
          setTimeout(() => {
            checkSpotifyConnection();
          }, 1000);
        }
      }
    } catch (error) {
      console.error('Error connecting to Spotify:', error);
      Alert.alert('Error', 'Failed to connect to Spotify. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const pollForSpotifyConnection = () => {
    let attempts = 0;
    const maxAttempts = 30; // Poll for 30 seconds
    
    const pollInterval = setInterval(async () => {
      attempts++;
      
      try {
        const { data, error } = await supabase
          .from('user_spotify_tokens')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (!error && data) {
          // Tokens found!
          clearInterval(pollInterval);
          setSpotifyTokens(data);
          setLoading(false);
          Alert.alert('Success!', 'Spotify connected successfully!', [
            { text: 'OK', onPress: onConnected }
          ]);
          return;
        }
      } catch (error) {
        console.error('Error polling for tokens:', error);
      }

      if (attempts >= maxAttempts) {
        clearInterval(pollInterval);
        setLoading(false);
        Alert.alert(
          'Connection Timeout',
          'We didn\'t detect a successful Spotify connection. Please try again.',
          [{ text: 'OK' }]
        );
      }
    }, 1000); // Poll every second
  };

  const disconnectSpotify = async () => {
    if (!user) return;

    const { error } = await supabase
      .from('user_spotify_tokens')
      .delete()
      .eq('user_id', user.id);

    if (!error) {
      setSpotifyTokens(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <ActivityIndicator size="large" color="#22c55e" />
          <Text style={styles.loadingText}>Checking Spotify connection...</Text>
        </View>
      </View>
    );
  }

  if (spotifyTokens) {
    const isExpired = new Date(spotifyTokens.expires_at) < new Date();
    
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.icon}>🎧</Text>
          
          <View style={[styles.alert, isExpired ? styles.alertWarning : styles.alertSuccess]}>
            <Text style={styles.alertTitle}>
              {isExpired ? '⚠️ Connection Expired' : '✅ Spotify Premium Connected!'}
            </Text>
            <Text style={styles.alertText}>
              {isExpired 
                ? 'Your Spotify token has expired. Please reconnect to continue playing.'
                : 'Ready to play AI Music Bingo'
              }
            </Text>
          </View>
          
          <View style={styles.buttonContainer}>
            {isExpired && (
              <TouchableOpacity style={styles.primaryButton} onPress={connectSpotify}>
                <Text style={styles.primaryButtonText}>🔄 Reconnect Spotify</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.dangerButton} onPress={disconnectSpotify}>
              <Text style={styles.dangerButtonText}>Disconnect</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.icon}>🎵</Text>
        <Text style={styles.title}>Connect Spotify Premium</Text>
        
        <View style={styles.alert}>
          <Text style={styles.alertTitle}>🎧 Spotify Premium Required</Text>
          <Text style={styles.alertText}>
            You need a Spotify Premium account to control playback and enjoy the full AI Music Bingo experience.
          </Text>
        </View>

        <View style={styles.features}>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>🎵</Text>
            <Text style={styles.featureTitle}>High Quality</Text>
            <Text style={styles.featureText}>Stream premium audio</Text>
          </View>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>🎮</Text>
            <Text style={styles.featureTitle}>Full Control</Text>
            <Text style={styles.featureText}>Play on any device</Text>
          </View>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>🤖</Text>
            <Text style={styles.featureTitle}>AI Cards</Text>
            <Text style={styles.featureText}>Smart challenges</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={connectSpotify}>
          <Text style={styles.primaryButtonText}>🎵 Connect Spotify Premium</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
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
  loadingText: {
    color: '#ffffff',
    fontSize: 18,
    marginTop: 16,
  },
  alert: {
    backgroundColor: '#1e40af',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    width: '100%',
  },
  alertSuccess: {
    backgroundColor: '#059669',
  },
  alertWarning: {
    backgroundColor: '#d97706',
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
  features: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 32,
  },
  feature: {
    alignItems: 'center',
    flex: 1,
  },
  featureIcon: {
    fontSize: 24,
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
  buttonContainer: {
    width: '100%',
    gap: 12,
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
  dangerButton: {
    backgroundColor: '#dc2626',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    width: '100%',
  },
  dangerButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});