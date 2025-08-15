import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { User } from '@supabase/supabase-js';
import { SpotifyTrack } from '../lib/spotify';
import { supabase } from '../lib/supabase';

interface SpotifyDevice {
  id: string;
  is_active: boolean;
  is_private_session: boolean;
  is_restricted: boolean;
  name: string;
  type: string;
  volume_percent: number;
}

interface SpotifyPlayerProps {
  user: User;
  tracks: SpotifyTrack[];
  currentSongIndex: number;
  onSongChange: (index: number) => void;
  gameCompleted: boolean;
}

export default function SpotifyPlayer({ 
  user, 
  tracks, 
  currentSongIndex, 
  onSongChange, 
  gameCompleted 
}: SpotifyPlayerProps) {
  const [devices, setDevices] = useState<SpotifyDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<SpotifyTrack | null>(null);
  const [accessToken, setAccessToken] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [devicesLoaded, setDevicesLoaded] = useState(false);
  const [originalVolume, setOriginalVolume] = useState<number>(50);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tracks.length > 0 && currentSongIndex < tracks.length) {
      setCurrentTrack(tracks[currentSongIndex]);
    }
  }, [tracks, currentSongIndex]);

  // Get access token and load devices
  useEffect(() => {
    const initializeSpotify = async () => {
      const { data, error } = await supabase
        .from('user_spotify_tokens')
        .select('access_token')
        .eq('user_id', user.id)
        .single();

      if (!error && data) {
        setAccessToken(data.access_token);
        await loadDevices(data.access_token);
      }
    };

    initializeSpotify();
  }, [user.id]);

  // Load available Spotify devices
  const loadDevices = async (token: string) => {
    try {
      setLoading(true);
      const response = await fetch('https://api.spotify.com/v1/me/player/devices', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDevices(data.devices);
        setDevicesLoaded(true);
        
        // Auto-select active device or first available device
        const activeDevice = data.devices.find((d: SpotifyDevice) => d.is_active);
        if (activeDevice) {
          setSelectedDevice(activeDevice.id);
          setOriginalVolume(activeDevice.volume_percent || 50);
        } else if (data.devices.length > 0) {
          setSelectedDevice(data.devices[0].id);
          setOriginalVolume(data.devices[0].volume_percent || 50);
        }
      }
    } catch (error) {
      console.error('Error loading devices:', error);
      setDevicesLoaded(true);
    } finally {
      setLoading(false);
    }
  };

  // Auto-progression timer (30 seconds per song)
  useEffect(() => {
    if (!gameStarted || gameCompleted) return;

    setTimeLeft(30);
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Move to next song
          if (currentSongIndex < tracks.length - 1) {
            onSongChange(currentSongIndex + 1);
          } else {
            setGameStarted(false); // End of playlist
          }
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameStarted, currentSongIndex, tracks.length, onSongChange, gameCompleted]);

  const startGame = useCallback(async () => {
    if (!selectedDevice || !currentTrack) {
      Alert.alert('No Device', 'Please select a Spotify device first');
      return;
    }

    setGameStarted(true);
    await playCurrentTrack();
  }, [selectedDevice, currentTrack]);

  const stopGame = useCallback(async () => {
    setGameStarted(false);
    setIsPlaying(false);
    setTimeLeft(0);

    try {
      await fetch('https://api.spotify.com/v1/me/player/pause', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
    } catch (error) {
      console.error('Error pausing playback:', error);
    }
  }, [accessToken]);

  const playCurrentTrack = useCallback(async () => {
    if (!selectedDevice || !currentTrack || !accessToken) return;

    try {
      // First, transfer playback to the selected device if needed
      await fetch('https://api.spotify.com/v1/me/player', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          device_ids: [selectedDevice],
          play: false,
        }),
      });

      // Small delay to ensure device transfer
      await new Promise(resolve => setTimeout(resolve, 500));

      // Then start playing the track
      const trackUri = `spotify:track:${currentTrack.id}`;
      
      const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${selectedDevice}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uris: [trackUri],
          position_ms: Math.floor((currentTrack.duration_ms || 180000) * 0.3), // Start at 30% through the song
        }),
      });

      if (response.ok) {
        setIsPlaying(true);
      } else {
        const errorData = await response.text();
        console.error('Failed to start playback:', response.status, errorData);
        Alert.alert('Playback Error', 'Failed to start playback. Make sure Spotify is open on your selected device.');
      }
    } catch (error) {
      console.error('Error playing track:', error);
      Alert.alert('Error', 'Failed to play track');
    }
  }, [selectedDevice, currentTrack, accessToken]);

  const pauseTrack = useCallback(async () => {
    try {
      await fetch('https://api.spotify.com/v1/me/player/pause', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      setIsPlaying(false);
    } catch (error) {
      console.error('Error pausing track:', error);
    }
  }, [accessToken]);

  const nextSong = useCallback(() => {
    if (currentSongIndex < tracks.length - 1) {
      onSongChange(currentSongIndex + 1);
      if (gameStarted) {
        setTimeLeft(30); // Reset timer for manual skip
      }
    }
  }, [currentSongIndex, tracks.length, onSongChange, gameStarted]);

  const previousSong = useCallback(() => {
    if (currentSongIndex > 0) {
      onSongChange(currentSongIndex - 1);
      if (gameStarted) {
        setTimeLeft(30); // Reset timer for manual skip
      }
    }
  }, [currentSongIndex, onSongChange, gameStarted]);

  // Auto-play when song changes during game
  useEffect(() => {
    if (gameStarted && currentTrack && selectedDevice) {
      playCurrentTrack();
    }
  }, [currentTrack, gameStarted, selectedDevice, playCurrentTrack]);

  if (!currentTrack) {
    return (
      <View style={styles.container}>
        <Text style={styles.noTrackText}>No track selected</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🎧 Spotify Player</Text>
      </View>

      {/* Game Status */}
      {gameStarted && (
        <View style={styles.gameStatus}>
          <Text style={styles.timer}>⏱️ {timeLeft}s</Text>
          <Text style={styles.gameStatusText}>Listen and mark your bingo card!</Text>
        </View>
      )}

      {/* Current Track Info */}
      <View style={styles.trackInfo}>
        {currentTrack.album.images.length > 0 && (
          <Image 
            source={{ uri: currentTrack.album.images[0].url }}
            style={styles.albumArt}
          />
        )}
        <Text style={styles.trackName}>{currentTrack.name}</Text>
        <Text style={styles.artistName}>
          {currentTrack.artists.map(a => a.name).join(', ')}
        </Text>
        <Text style={styles.albumName}>{currentTrack.album.name}</Text>
      </View>

      {/* Device Selection */}
      {devicesLoaded && devices.length > 0 && (
        <View style={styles.deviceSection}>
          <Text style={styles.deviceLabel}>Playback Device:</Text>
          <View style={styles.deviceList}>
            {devices.map((device) => (
              <TouchableOpacity
                key={device.id}
                style={[
                  styles.deviceButton,
                  selectedDevice === device.id && styles.selectedDevice
                ]}
                onPress={() => {
                  setSelectedDevice(device.id);
                  setOriginalVolume(device.volume_percent || 50);
                }}
              >
                <Text style={[
                  styles.deviceText,
                  selectedDevice === device.id && styles.selectedDeviceText
                ]}>
                  {device.name} {device.is_active ? '(Active)' : ''}
                </Text>
                <Text style={[
                  styles.deviceType,
                  selectedDevice === device.id && styles.selectedDeviceText
                ]}>
                  {device.type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={() => loadDevices(accessToken)}
          >
            <Text style={styles.refreshButtonText}>🔄 Refresh Devices</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* No Devices Found */}
      {devicesLoaded && devices.length === 0 && (
        <View style={styles.noDevicesCard}>
          <Text style={styles.noDevicesTitle}>📱 No Spotify Devices Found</Text>
          <Text style={styles.noDevicesText}>
            Please open Spotify on your phone, computer, or web browser first, then refresh.
          </Text>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={() => loadDevices(accessToken)}
          >
            <Text style={styles.refreshButtonText}>🔄 Refresh Devices</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Loading Devices */}
      {loading && (
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color="#22c55e" />
          <Text style={styles.loadingText}>Loading Spotify devices...</Text>
        </View>
      )}

      {/* Game Controls */}
      {selectedDevice && !gameStarted ? (
        <TouchableOpacity
          style={[styles.primaryButton, gameCompleted && styles.disabledButton]}
          onPress={startGame}
          disabled={gameCompleted}
        >
          <Text style={styles.primaryButtonText}>🎵 Start Auto-Play Game</Text>
          <Text style={styles.buttonSubtext}>(30s per song)</Text>
        </TouchableOpacity>
      ) : selectedDevice && gameStarted ? (
        <TouchableOpacity style={styles.dangerButton} onPress={stopGame}>
          <Text style={styles.dangerButtonText}>⏹️ Stop Game</Text>
        </TouchableOpacity>
      ) : null}

      {/* Manual Playback Controls */}
      {selectedDevice && (
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={isPlaying ? pauseTrack : playCurrentTrack}
        >
          <Text style={styles.secondaryButtonText}>
            {isPlaying ? '⏸️ Pause' : '▶️ Play'} Current Song
          </Text>
        </TouchableOpacity>
      )}

      {/* Navigation Controls */}
      <View style={styles.navigationControls}>
        <TouchableOpacity
          style={[styles.navButton, currentSongIndex === 0 && styles.disabledButton]}
          onPress={previousSong}
          disabled={currentSongIndex === 0}
        >
          <Text style={[styles.navButtonText, currentSongIndex === 0 && styles.disabledText]}>
            ⏮️ Previous
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.navButton, currentSongIndex === tracks.length - 1 && styles.disabledButton]}
          onPress={nextSong}
          disabled={currentSongIndex === tracks.length - 1}
        >
          <Text style={[styles.navButtonText, currentSongIndex === tracks.length - 1 && styles.disabledText]}>
            Next ⏭️
          </Text>
        </TouchableOpacity>
      </View>

      {/* Track Progress */}
      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>
          Track {currentSongIndex + 1} of {tracks.length}
        </Text>
      </View>

      {/* Instructions */}
      <View style={styles.instructionsCard}>
        <Text style={styles.instructionsTitle}>🎧 Spotify Premium Required</Text>
        <Text style={styles.instructionsText}>
          Music plays directly through your Spotify account. Make sure this device is authorized.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1f2937',
    borderRadius: 16,
    padding: 20,
    margin: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  noTrackText: {
    color: '#9ca3af',
    textAlign: 'center',
    fontSize: 16,
  },
  gameStatus: {
    backgroundColor: '#059669',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  timer: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  gameStatusText: {
    color: '#ffffff',
    fontWeight: '500',
  },
  trackInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  albumArt: {
    width: 120,
    height: 120,
    borderRadius: 12,
    marginBottom: 12,
  },
  trackName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 4,
  },
  artistName: {
    fontSize: 16,
    color: '#d1d5db',
    textAlign: 'center',
    marginBottom: 2,
  },
  albumName: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  deviceSection: {
    marginBottom: 20,
  },
  deviceLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 12,
  },
  deviceList: {
    marginBottom: 12,
  },
  deviceButton: {
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedDevice: {
    borderColor: '#22c55e',
    backgroundColor: '#065f46',
  },
  deviceText: {
    color: '#ffffff',
    fontWeight: '500',
    fontSize: 14,
  },
  selectedDeviceText: {
    color: '#22c55e',
  },
  deviceType: {
    color: '#9ca3af',
    fontSize: 12,
    marginTop: 2,
  },
  refreshButton: {
    backgroundColor: '#6b7280',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  refreshButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  noDevicesCard: {
    backgroundColor: '#f59e0b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  noDevicesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  noDevicesText: {
    color: '#ffffff',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  loadingCard: {
    alignItems: 'center',
    padding: 20,
    marginBottom: 20,
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 16,
    marginTop: 12,
  },
  primaryButton: {
    backgroundColor: '#22c55e',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  buttonSubtext: {
    color: '#ffffff',
    fontSize: 12,
    opacity: 0.8,
    marginTop: 2,
  },
  dangerButton: {
    backgroundColor: '#ef4444',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  dangerButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#6b7280',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  secondaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  navigationControls: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  navButton: {
    backgroundColor: '#6b7280',
    borderRadius: 12,
    paddingVertical: 12,
    flex: 1,
    alignItems: 'center',
  },
  navButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#4b5563',
    opacity: 0.5,
  },
  disabledText: {
    color: '#9ca3af',
  },
  progressContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  progressText: {
    backgroundColor: '#ffffff',
    color: '#000000',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    fontSize: 14,
    fontWeight: '500',
  },
  instructionsCard: {
    backgroundColor: '#1e40af',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  instructionsText: {
    color: '#ffffff',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});