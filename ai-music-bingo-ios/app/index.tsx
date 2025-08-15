import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import AuthScreen from '../components/AuthScreen';
import PlayScreen from '../components/PlayScreen';
import SettingsScreen from '../components/SettingsScreen';

export default function HomeScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [activeTab, setActiveTab] = useState<'play' | 'settings'>('play');

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        setShowAuth(false); // Hide auth screen when user signs in
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Sign out error:', error);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (showAuth || !user) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.header}>
          <Text style={styles.title}>🎵 AI Music Bingo</Text>
          <Text style={styles.subtitle}>
            Play bingo with AI-generated music cards powered by Spotify Premium
          </Text>
        </View>
        <AuthScreen onAuthSuccess={() => setShowAuth(false)} />
      </SafeAreaView>
    );
  }

  // Main app with tabs
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Content */}
      <View style={styles.content}>
        {activeTab === 'play' ? (
          <PlayScreen user={user} />
        ) : (
          <SettingsScreen user={user} onSignOut={signOut} />
        )}
      </View>

      {/* Bottom Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'play' && styles.activeTab]}
          onPress={() => setActiveTab('play')}
        >
          <Text style={[styles.tabIcon, activeTab === 'play' && styles.activeTabIcon]}>
            🎮
          </Text>
          <Text style={[styles.tabText, activeTab === 'play' && styles.activeTabText]}>
            Play
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'settings' && styles.activeTab]}
          onPress={() => setActiveTab('settings')}
        >
          <Text style={[styles.tabIcon, activeTab === 'settings' && styles.activeTabIcon]}>
            ⚙️
          </Text>
          <Text style={[styles.tabText, activeTab === 'settings' && styles.activeTabText]}>
            Settings
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 18,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#22c55e',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    color: '#d1d5db',
    textAlign: 'center',
    lineHeight: 24,
  },
  content: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#1f2937',
    borderTopWidth: 1,
    borderTopColor: '#374151',
    paddingBottom: 34, // Account for home indicator on iOS
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  activeTab: {
    // Active tab styling handled by text/icon colors
  },
  tabIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  activeTabIcon: {
    // Active state handled by color
  },
  tabText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9ca3af',
  },
  activeTabText: {
    color: '#22c55e',
  },
});