/**
 * Audio Context
 *
 * Provides global audio player state and controls throughout the app.
 * Wraps the AudioPlayer service with React state management.
 *
 * Usage:
 *   const { play, pause, currentTrack } = useAudio();
 */

import { createContext, useContext, useState, useRef, useCallback, useEffect, ReactNode } from 'react';
import { AudioPlayer, PlayerState } from '../services/audioPlayer';
import { AudioTrack } from '../types/metadata';
import { Show } from '../types/show';

/**
 * Audio context value interface
 * Exposes all audio player state and controls
 */
interface AudioContextValue {
  // State
  currentShow: Show | null;
  currentTrack: AudioTrack | null;
  playerState: PlayerState;
  currentTime: number;
  duration: number;
  volume: number;
  playlist: AudioTrack[];
  currentIndex: number;

  // Actions
  loadShow: (show: Show, tracks: AudioTrack[], startIndex?: number) => void;
  play: () => void;
  pause: () => void;
  togglePlayPause: () => void;
  next: () => void;
  previous: () => void;
  seekTo: (time: number) => void;
  setVolume: (volume: number) => void;
}

/**
 * Audio context
 */
const AudioContext = createContext<AudioContextValue | null>(null);

/**
 * Audio Provider Props
 */
interface AudioProviderProps {
  children: ReactNode;
}

/**
 * Audio Provider Component
 *
 * Wraps the app to provide global audio player state.
 * Should be placed near the root of the component tree.
 */
export function AudioProvider({ children }: AudioProviderProps) {
  // State
  const [currentShow, setCurrentShow] = useState<Show | null>(null);
  const [currentTrack, setCurrentTrack] = useState<AudioTrack | null>(null);
  const [playerState, setPlayerState] = useState<PlayerState>('idle');
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.8);
  const [playlist, setPlaylist] = useState<AudioTrack[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Player instance (persists across renders)
  const playerRef = useRef<AudioPlayer | null>(null);

  // Initialize player on mount
  useEffect(() => {
    if (!playerRef.current) {
      playerRef.current = new AudioPlayer({
        onStateChange: (state) => {
          setPlayerState(state);
        },
        onTrackChange: (track) => {
          setCurrentTrack(track);
          if (track && playerRef.current) {
            setCurrentIndex(playerRef.current.getCurrentIndex());
          }
        },
        onProgress: (current, dur) => {
          setCurrentTime(current);
          setDuration(dur || 0);
        },
        onError: (error) => {
          console.error('[AudioPlayer] Error:', error.message);
        }
      });

      // Set initial volume
      playerRef.current.setVolume(volume);
    }

    // Cleanup on unmount
    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Load a show and its tracks into the player
   */
  const loadShow = useCallback((show: Show, tracks: AudioTrack[], startIndex = 0) => {
    setCurrentShow(show);
    setPlaylist(tracks);
    setCurrentIndex(startIndex);
    playerRef.current?.loadPlaylist(tracks, startIndex);
  }, []);

  /**
   * Start playback
   */
  const play = useCallback(() => {
    playerRef.current?.play();
  }, []);

  /**
   * Pause playback
   */
  const pause = useCallback(() => {
    playerRef.current?.pause();
  }, []);

  /**
   * Toggle between play and pause
   */
  const togglePlayPause = useCallback(() => {
    playerRef.current?.togglePlayPause();
  }, []);

  /**
   * Advance to next track
   */
  const next = useCallback(() => {
    playerRef.current?.next();
  }, []);

  /**
   * Go to previous track
   */
  const previous = useCallback(() => {
    playerRef.current?.previous();
  }, []);

  /**
   * Seek to a specific time in the current track
   */
  const seekTo = useCallback((time: number) => {
    playerRef.current?.seekTo(time);
  }, []);

  /**
   * Set volume level
   */
  const setVolume = useCallback((vol: number) => {
    const clampedVolume = Math.max(0, Math.min(1, vol));
    setVolumeState(clampedVolume);
    playerRef.current?.setVolume(clampedVolume);
  }, []);

  // Context value
  const value: AudioContextValue = {
    // State
    currentShow,
    currentTrack,
    playerState,
    currentTime,
    duration,
    volume,
    playlist,
    currentIndex,

    // Actions
    loadShow,
    play,
    pause,
    togglePlayPause,
    next,
    previous,
    seekTo,
    setVolume
  };

  return (
    <AudioContext.Provider value={value}>
      {children}
    </AudioContext.Provider>
  );
}

/**
 * Custom hook to access audio player context
 *
 * Must be used within an AudioProvider
 *
 * @throws Error if used outside AudioProvider
 */
export function useAudio() {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within AudioProvider');
  }
  return context;
}
