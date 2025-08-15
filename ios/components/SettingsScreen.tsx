import React, { useState, useEffect } from 'react';
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
import { supabase } from '../lib/supabase';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

interface SpotifyTokens {
  access_token: string;
  refresh_token: string;
  expires_at: string;
  scope: string;
}

interface SettingsScreenProps {
  user: User;
  onSignOut: () => void;
}

export default function SettingsScreen({ user, onSignOut }: SettingsScreenProps) {
  const [spotifyTokens, setSpotifyTokens] = useState<SpotifyTokens | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSpotifyConnection();
  }, []);

  const checkSpotifyConnection = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('user_spotify_tokens')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!error && data) {
      setSpotifyTokens(data);
    } else {
      setSpotifyTokens(null);
    }
    setLoading(false);
  };

  const disconnectSpotify = async () => {
    Alert.alert(
      'Disconnect Spotify',
      'Are you sure you want to disconnect your Spotify account? You\'ll need to reconnect to play music.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase
              .from('user_spotify_tokens')
              .delete()
              .eq('user_id', user.id);

            if (!error) {
              setSpotifyTokens(null);
              Alert.alert('Success', 'Spotify account disconnected');
            } else {
              Alert.alert('Error', 'Failed to disconnect Spotify account');
            }
          }
        }
      ]
    );
  };

  const connectSpotify = async () => {
    try {
      const spotifyClientId = process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID;
      const redirectUri = 'https://bingo.sals.site/api/spotify/callback';
      const state = user.id;
      
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
      
      if (result.type === 'opened' || result.type === 'cancel' || result.type === 'dismiss') {
        // Check for connection after browser closes
        setTimeout(() => {
          checkSpotifyConnection();
        }, 1000);
      }
    } catch (error) {
      console.error('Error connecting to Spotify:', error);
      Alert.alert('Error', 'Failed to connect to Spotify. Please try again.');
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: onSignOut
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#22c55e" />
          <Text style={styles.loadingText}>Loading settings...</Text>
        </View>
      </View>
    );
  }

  const isSpotifyExpired = spotifyTokens ? new Date(spotifyTokens.expires_at) < new Date() : false;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Text style={styles.title}>⚙️ Settings</Text>
      </View>

      {/* User Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{user.email}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>User ID</Text>
            <Text style={styles.valueSmall}>{user.id}</Text>
          </View>
        </View>
      </View>

      {/* Spotify Connection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Spotify Integration</Text>
        <View style={styles.card}>
          {spotifyTokens ? (
            <>
              <View style={styles.row}>
                <Text style={styles.label}>Status</Text>
                <View style={styles.statusContainer}>
                  <View style={[styles.statusDot, isSpotifyExpired ? styles.statusExpired : styles.statusConnected]} />
                  <Text style={[styles.statusText, isSpotifyExpired ? styles.statusExpiredText : styles.statusConnectedText]}>
                    {isSpotifyExpired ? 'Expired' : 'Connected'}
                  </Text>
                </View>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Expires</Text>
                <Text style={styles.value}>
                  {new Date(spotifyTokens.expires_at).toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Scopes</Text>
                <Text style={styles.valueSmall}>{spotifyTokens.scope}</Text>
              </View>
              <TouchableOpacity style={styles.dangerButton} onPress={disconnectSpotify}>
                <Text style={styles.dangerButtonText}>Disconnect Spotify</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.row}>
                <Text style={styles.label}>Status</Text>
                <View style={styles.statusContainer}>
                  <View style={[styles.statusDot, styles.statusDisconnected]} />
                  <Text style={[styles.statusText, styles.statusDisconnectedText]}>
                    Not Connected
                  </Text>
                </View>
              </View>
              <Text style={styles.description}>
                Connect your Spotify Premium account to play music and generate real bingo cards.
              </Text>
              <TouchableOpacity style={styles.primaryButton} onPress={connectSpotify}>
                <Text style={styles.primaryButtonText}>Connect Spotify</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* App Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>App Version</Text>
            <Text style={styles.value}>1.0.0</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Platform</Text>
            <Text style={styles.value}>iOS (Expo)</Text>
          </View>
        </View>
      </View>

      {/* Sign Out */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutButtonText}>Sign Out</Text>
        </TouchableOpacity>
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 16,
    marginTop: 12,
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
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  label: {
    fontSize: 16,
    color: '#d1d5db',
    fontWeight: '500',
  },
  value: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
  },
  valueSmall: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '400',
    maxWidth: 200,
    textAlign: 'right',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusConnected: {
    backgroundColor: '#22c55e',
  },
  statusExpired: {
    backgroundColor: '#f59e0b',
  },
  statusDisconnected: {
    backgroundColor: '#ef4444',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '500',
  },
  statusConnectedText: {
    color: '#22c55e',
  },
  statusExpiredText: {
    color: '#f59e0b',
  },
  statusDisconnectedText: {
    color: '#ef4444',
  },
  description: {
    fontSize: 14,
    color: '#9ca3af',
    lineHeight: 20,
    marginVertical: 12,
  },
  primaryButton: {
    backgroundColor: '#22c55e',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  dangerButton: {
    backgroundColor: '#ef4444',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  dangerButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  signOutButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#ef4444',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  signOutButtonText: {
    color: '#ef4444',
    fontSize: 18,
    fontWeight: '600',
  },
});