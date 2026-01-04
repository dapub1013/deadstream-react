/**
 * Audio Player Tests
 *
 * Tests for the HTML5 audio player service.
 * Tests playlist management, playback controls, and event handling.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AudioPlayer, PlayerState } from './audioPlayer';
import { AudioTrack } from '../types/metadata';

// Mock audio tracks for testing
const mockTracks: AudioTrack[] = [
  {
    url: 'https://archive.org/download/test/track1.mp3',
    filename: 'track1.mp3',
    title: 'China Cat Sunflower',
    duration: 300,
    format: 'VBR MP3',
    size: 5000000,
    index: 0
  },
  {
    url: 'https://archive.org/download/test/track2.mp3',
    filename: 'track2.mp3',
    title: 'I Know You Rider',
    duration: 360,
    format: 'VBR MP3',
    size: 6000000,
    index: 1
  },
  {
    url: 'https://archive.org/download/test/track3.mp3',
    filename: 'track3.mp3',
    title: 'Fire on the Mountain',
    duration: 420,
    format: 'VBR MP3',
    size: 7000000,
    index: 2
  }
];

describe('AudioPlayer', () => {
  let player: AudioPlayer;

  beforeEach(() => {
    player = new AudioPlayer();
  });

  afterEach(() => {
    player.destroy();
  });

  describe('Playlist Management', () => {
    it('loads a playlist', () => {
      player.loadPlaylist(mockTracks);

      expect(player.getCurrentTrack()).toEqual(mockTracks[0]);
      expect(player.getPlaylist()).toEqual(mockTracks);
      expect(player.getCurrentIndex()).toBe(0);
    });

    it('loads playlist with custom start index', () => {
      player.loadPlaylist(mockTracks, 1);

      expect(player.getCurrentTrack()).toEqual(mockTracks[1]);
      expect(player.getCurrentIndex()).toBe(1);
    });

    it('clamps start index to valid range', () => {
      player.loadPlaylist(mockTracks, 99);

      expect(player.getCurrentIndex()).toBe(2); // Last track
    });

    it('handles empty playlist', () => {
      player.loadPlaylist([]);

      expect(player.getCurrentTrack()).toBeNull();
      expect(player.getPlaylist()).toEqual([]);
    });
  });

  describe('Track Navigation', () => {
    beforeEach(() => {
      player.loadPlaylist(mockTracks);
    });

    it('advances to next track', () => {
      player.next();

      expect(player.getCurrentTrack()).toEqual(mockTracks[1]);
      expect(player.getCurrentIndex()).toBe(1);
    });

    it('advances through entire playlist', () => {
      player.next(); // Track 2
      player.next(); // Track 3

      expect(player.getCurrentTrack()).toEqual(mockTracks[2]);
      expect(player.getCurrentIndex()).toBe(2);
    });

    it('stops at end of playlist', () => {
      player.loadPlaylist(mockTracks, 2); // Start at last track
      player.next(); // Should not advance past last track

      expect(player.getCurrentIndex()).toBe(2);
      expect(player.getState()).toBe('idle');
    });

    it('goes to previous track', () => {
      player.loadPlaylist(mockTracks, 2); // Start at track 3

      // Mock currentTime to be less than 3 seconds
      Object.defineProperty(player['audio'], 'currentTime', {
        get: () => 1,
        set: vi.fn(),
        configurable: true
      });

      player.previous();

      expect(player.getCurrentTrack()).toEqual(mockTracks[1]);
      expect(player.getCurrentIndex()).toBe(1);
    });

    it('restarts current track if more than 3 seconds in', () => {
      player.loadPlaylist(mockTracks, 1);

      // Mock currentTime to be more than 3 seconds
      const setCurrentTime = vi.fn();
      Object.defineProperty(player['audio'], 'currentTime', {
        get: () => 5,
        set: setCurrentTime,
        configurable: true
      });

      player.previous();

      // Should restart current track, not go to previous
      expect(setCurrentTime).toHaveBeenCalledWith(0);
      expect(player.getCurrentIndex()).toBe(1);
    });

    it('restarts first track when at beginning', () => {
      player.loadPlaylist(mockTracks, 0);

      const setCurrentTime = vi.fn();
      Object.defineProperty(player['audio'], 'currentTime', {
        get: () => 1,
        set: setCurrentTime,
        configurable: true
      });

      player.previous();

      expect(setCurrentTime).toHaveBeenCalledWith(0);
      expect(player.getCurrentIndex()).toBe(0);
    });
  });

  describe('Playback Controls', () => {
    it('starts with idle state', () => {
      expect(player.getState()).toBe('idle');
    });

    it('has play method', () => {
      expect(typeof player.play).toBe('function');
    });

    it('has pause method', () => {
      expect(typeof player.pause).toBe('function');
    });

    it('has togglePlayPause method', () => {
      expect(typeof player.togglePlayPause).toBe('function');
    });
  });

  describe('Seek and Progress', () => {
    beforeEach(() => {
      player.loadPlaylist(mockTracks);
    });

    it('seeks to specific time', () => {
      const setCurrentTime = vi.fn();
      Object.defineProperty(player['audio'], 'currentTime', {
        set: setCurrentTime,
        configurable: true
      });
      Object.defineProperty(player['audio'], 'duration', {
        get: () => 300,
        configurable: true
      });

      player.seekTo(150);

      expect(setCurrentTime).toHaveBeenCalledWith(150);
    });

    it('clamps seek time to duration', () => {
      const setCurrentTime = vi.fn();
      Object.defineProperty(player['audio'], 'currentTime', {
        set: setCurrentTime,
        configurable: true
      });
      Object.defineProperty(player['audio'], 'duration', {
        get: () => 300,
        configurable: true
      });

      player.seekTo(500); // Beyond duration

      expect(setCurrentTime).toHaveBeenCalledWith(300);
    });

    it('does not seek to negative time', () => {
      const setCurrentTime = vi.fn();
      Object.defineProperty(player['audio'], 'currentTime', {
        set: setCurrentTime,
        configurable: true
      });
      Object.defineProperty(player['audio'], 'duration', {
        get: () => 300,
        configurable: true
      });

      player.seekTo(-10);

      expect(setCurrentTime).toHaveBeenCalledWith(0);
    });

    it('gets current time', () => {
      Object.defineProperty(player['audio'], 'currentTime', {
        get: () => 123.45,
        configurable: true
      });

      expect(player.getCurrentTime()).toBe(123.45);
    });

    it('gets duration', () => {
      Object.defineProperty(player['audio'], 'duration', {
        get: () => 300.5,
        configurable: true
      });

      expect(player.getDuration()).toBe(300.5);
    });

    it('returns 0 for duration if not available', () => {
      Object.defineProperty(player['audio'], 'duration', {
        get: () => NaN,
        configurable: true
      });

      expect(player.getDuration()).toBe(0);
    });
  });

  describe('Volume Control', () => {
    it('sets volume', () => {
      player.setVolume(0.5);
      expect(player.getVolume()).toBe(0.5);
    });

    it('clamps volume to 0-1 range', () => {
      player.setVolume(1.5);
      expect(player.getVolume()).toBe(1);

      player.setVolume(-0.5);
      expect(player.getVolume()).toBe(0);
    });

    it('gets current volume', () => {
      player.setVolume(0.75);
      expect(player.getVolume()).toBe(0.75);
    });
  });

  describe('Event Callbacks', () => {
    it('calls onStateChange callback', () => {
      const onStateChange = vi.fn();
      const player = new AudioPlayer({ onStateChange });

      // Simulate state change by triggering audio events
      const audio = player['audio'];
      audio.dispatchEvent(new Event('loadstart'));

      expect(onStateChange).toHaveBeenCalledWith('loading');
    });

    it('calls onTrackChange callback', () => {
      const onTrackChange = vi.fn();
      const player = new AudioPlayer({ onTrackChange });

      player.loadPlaylist(mockTracks);

      expect(onTrackChange).toHaveBeenCalledWith(mockTracks[0]);
    });

    it('calls onProgress callback', () => {
      const onProgress = vi.fn();
      const player = new AudioPlayer({ onProgress });

      // Mock duration
      Object.defineProperty(player['audio'], 'duration', {
        get: () => 300,
        configurable: true
      });
      Object.defineProperty(player['audio'], 'currentTime', {
        get: () => 150,
        configurable: true
      });

      // Simulate timeupdate event
      player['audio'].dispatchEvent(new Event('timeupdate'));

      expect(onProgress).toHaveBeenCalledWith(150, 300);
    });

    it('calls onError callback on audio error', () => {
      const onError = vi.fn();
      const player = new AudioPlayer({ onError });

      // Simulate error event
      player['audio'].dispatchEvent(new Event('error'));

      expect(onError).toHaveBeenCalled();
      expect(player.getState()).toBe('error');
    });
  });

  describe('Cleanup', () => {
    it('cleans up resources on destroy', () => {
      player.loadPlaylist(mockTracks);
      player.destroy();

      expect(player.getPlaylist()).toEqual([]);
      expect(player.getCurrentIndex()).toBe(0);
      expect(player.getState()).toBe('idle');
    });
  });
});
