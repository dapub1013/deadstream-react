/**
 * HTML5 Audio Player Service
 *
 * Manages audio playback with playlist support, state management,
 * and error recovery. Uses the HTML5 Audio API for streaming
 * directly from archive.org.
 *
 * Features:
 * - Playlist management with auto-advance
 * - Progress tracking and seeking
 * - Volume control
 * - Event-driven state updates
 * - Error handling and recovery
 */

import { AudioTrack } from '../types/metadata';

/**
 * Player state machine states
 */
export type PlayerState = 'idle' | 'loading' | 'playing' | 'paused' | 'error';

/**
 * Configuration for the audio player
 */
export interface AudioPlayerConfig {
  /** Called when player state changes */
  onStateChange?: (state: PlayerState) => void;

  /** Called when current track changes */
  onTrackChange?: (track: AudioTrack | null) => void;

  /** Called during playback with current time and duration */
  onProgress?: (current: number, duration: number) => void;

  /** Called when an error occurs */
  onError?: (error: Error) => void;
}

/**
 * Audio Player class
 *
 * Manages HTML5 audio playback with playlist support.
 * Handles state management, track transitions, and error recovery.
 */
export class AudioPlayer {
  private audio: HTMLAudioElement;
  private playlist: AudioTrack[] = [];
  private currentIndex = 0;
  private state: PlayerState = 'idle';
  private config: AudioPlayerConfig;

  constructor(config: AudioPlayerConfig = {}) {
    this.audio = new Audio();
    this.config = config;
    this.setupEventListeners();
  }

  /**
   * Set up event listeners for the HTML5 audio element
   */
  private setupEventListeners() {
    // Loading started
    this.audio.addEventListener('loadstart', () => {
      this.setState('loading');
    });

    // Can start playing (buffered enough)
    this.audio.addEventListener('canplay', () => {
      if (this.state === 'loading') {
        this.setState('paused');
      }
    });

    // Playback started
    this.audio.addEventListener('playing', () => {
      this.setState('playing');
    });

    // Playback paused
    this.audio.addEventListener('pause', () => {
      if (this.state === 'playing') {
        this.setState('paused');
      }
    });

    // Track finished - auto-advance to next
    this.audio.addEventListener('ended', () => {
      this.next();
    });

    // Progress update (fires during playback)
    this.audio.addEventListener('timeupdate', () => {
      this.config.onProgress?.(this.audio.currentTime, this.audio.duration);
    });

    // Error occurred
    this.audio.addEventListener('error', () => {
      this.setState('error');
      const error = this.audio.error;
      const message = error ? `Audio error: ${error.message}` : 'Audio playback error';
      this.config.onError?.(new Error(message));
    });
  }

  /**
   * Load a playlist and optionally start at a specific track
   */
  loadPlaylist(tracks: AudioTrack[], startIndex = 0) {
    this.playlist = tracks;
    this.currentIndex = Math.max(0, Math.min(startIndex, tracks.length - 1));
    this.loadCurrentTrack();
  }

  /**
   * Load the current track from the playlist
   */
  private loadCurrentTrack() {
    const track = this.playlist[this.currentIndex];
    if (track) {
      this.audio.src = track.url;
      this.audio.load();
      this.config.onTrackChange?.(track);
    } else {
      this.config.onTrackChange?.(null);
    }
  }

  /**
   * Start or resume playback
   */
  async play() {
    try {
      await this.audio.play();
    } catch (error) {
      this.config.onError?.(error as Error);
    }
  }

  /**
   * Pause playback
   */
  pause() {
    this.audio.pause();
  }

  /**
   * Toggle between play and pause
   */
  togglePlayPause() {
    if (this.state === 'playing') {
      this.pause();
    } else {
      this.play();
    }
  }

  /**
   * Advance to next track in playlist
   * If at end of playlist, stop playback
   */
  next() {
    if (this.currentIndex < this.playlist.length - 1) {
      this.currentIndex++;
      this.loadCurrentTrack();
      this.play();
    } else {
      // End of playlist
      this.pause();
      this.setState('idle');
    }
  }

  /**
   * Go back to previous track in playlist
   * If at beginning, restart current track
   */
  previous() {
    if (this.audio.currentTime > 3) {
      // If more than 3 seconds into track, restart it
      this.audio.currentTime = 0;
    } else if (this.currentIndex > 0) {
      // Otherwise go to previous track
      this.currentIndex--;
      this.loadCurrentTrack();
      this.play();
    } else {
      // At beginning of playlist, restart first track
      this.audio.currentTime = 0;
    }
  }

  /**
   * Seek to a specific time in the current track
   * @param time Time in seconds
   */
  seekTo(time: number) {
    if (this.audio.duration) {
      this.audio.currentTime = Math.max(0, Math.min(time, this.audio.duration));
    }
  }

  /**
   * Set playback volume
   * @param volume Volume level (0.0 to 1.0)
   */
  setVolume(volume: number) {
    this.audio.volume = Math.max(0, Math.min(1, volume));
  }

  /**
   * Get the current playback volume
   */
  getVolume(): number {
    return this.audio.volume;
  }

  /**
   * Get the currently playing track
   */
  getCurrentTrack(): AudioTrack | null {
    return this.playlist[this.currentIndex] || null;
  }

  /**
   * Get the current track index
   */
  getCurrentIndex(): number {
    return this.currentIndex;
  }

  /**
   * Get the full playlist
   */
  getPlaylist(): AudioTrack[] {
    return this.playlist;
  }

  /**
   * Get the current player state
   */
  getState(): PlayerState {
    return this.state;
  }

  /**
   * Get current playback time
   */
  getCurrentTime(): number {
    return this.audio.currentTime;
  }

  /**
   * Get duration of current track
   */
  getDuration(): number {
    return this.audio.duration || 0;
  }

  /**
   * Set the player state and notify listeners
   */
  private setState(state: PlayerState) {
    if (this.state !== state) {
      this.state = state;
      this.config.onStateChange?.(state);
    }
  }

  /**
   * Clean up the player and release resources
   */
  destroy() {
    this.audio.pause();
    this.audio.src = '';
    this.playlist = [];
    this.currentIndex = 0;
    this.setState('idle');
  }
}
