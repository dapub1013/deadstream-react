/**
 * Tests for Preferences Management Service
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  loadPreferences,
  savePreferences,
  resetPreferences,
  getActiveScoringWeights,
  updateScoringPreset,
  updateCustomWeights,
  updatePlaybackPreferences,
  updateDisplayPreferences,
  exportPreferences,
  importPreferences,
} from './preferences';
import {
  DEFAULT_PREFERENCES,
  SCORING_PRESETS,
  ScoringWeights,
} from '../types/preferences';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('Preferences Service', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorageMock.clear();
  });

  describe('loadPreferences', () => {
    it('returns default preferences when localStorage is empty', () => {
      const prefs = loadPreferences();
      expect(prefs).toEqual(DEFAULT_PREFERENCES);
    });

    it('loads saved preferences from localStorage', () => {
      const testPrefs = {
        ...DEFAULT_PREFERENCES,
        playback: {
          ...DEFAULT_PREFERENCES.playback,
          volume: 0.5,
        },
      };

      localStorage.setItem('deadstream_preferences', JSON.stringify(testPrefs));

      const loaded = loadPreferences();
      expect(loaded.playback.volume).toBe(0.5);
    });

    it('merges with defaults if stored preferences are incomplete', () => {
      const partialPrefs = {
        playback: { volume: 0.6 },
      };

      localStorage.setItem(
        'deadstream_preferences',
        JSON.stringify(partialPrefs)
      );

      const loaded = loadPreferences();

      // Should have the custom volume
      expect(loaded.playback.volume).toBe(0.6);

      // Should also have default values for other fields
      expect(loaded.scoring.activePreset).toBe('balanced');
      expect(loaded.display.theme).toBe('dark');
    });

    it('returns defaults if localStorage contains invalid JSON', () => {
      localStorage.setItem('deadstream_preferences', 'invalid json {');

      const loaded = loadPreferences();
      expect(loaded).toEqual(DEFAULT_PREFERENCES);
    });
  });

  describe('savePreferences', () => {
    it('saves preferences to localStorage', () => {
      const prefs = {
        ...DEFAULT_PREFERENCES,
        playback: {
          ...DEFAULT_PREFERENCES.playback,
          volume: 0.7,
        },
      };

      const success = savePreferences(prefs);
      expect(success).toBe(true);

      const stored = localStorage.getItem('deadstream_preferences');
      expect(stored).toBeTruthy();

      const parsed = JSON.parse(stored!);
      expect(parsed.playback.volume).toBe(0.7);
    });

    it('returns true on successful save', () => {
      const success = savePreferences(DEFAULT_PREFERENCES);
      expect(success).toBe(true);
    });
  });

  describe('resetPreferences', () => {
    it('resets to default preferences', () => {
      // Save custom preferences first
      const custom = {
        ...DEFAULT_PREFERENCES,
        playback: { ...DEFAULT_PREFERENCES.playback, volume: 0.3 },
      };
      savePreferences(custom);

      // Reset
      const reset = resetPreferences();

      expect(reset).toEqual(DEFAULT_PREFERENCES);
      expect(reset.playback.volume).toBe(0.8); // Default volume
    });

    it('saves defaults to localStorage', () => {
      resetPreferences();

      const stored = localStorage.getItem('deadstream_preferences');
      expect(stored).toBeTruthy();

      const parsed = JSON.parse(stored!);
      expect(parsed).toEqual(DEFAULT_PREFERENCES);
    });
  });

  describe('getActiveScoringWeights', () => {
    it('returns preset weights for non-custom preset', () => {
      const prefs = {
        ...DEFAULT_PREFERENCES,
        scoring: { activePreset: 'audiophile' as const },
      };

      const weights = getActiveScoringWeights(prefs);
      expect(weights).toEqual(SCORING_PRESETS.audiophile.weights);
    });

    it('returns custom weights when preset is custom', () => {
      const customWeights: ScoringWeights = {
        sourceType: 0.5,
        format: 0.3,
        communityRating: 0.1,
        lineage: 0.05,
        taper: 0.05,
      };

      const prefs = {
        ...DEFAULT_PREFERENCES,
        scoring: {
          activePreset: 'custom' as const,
          customWeights,
        },
      };

      const weights = getActiveScoringWeights(prefs);
      expect(weights).toEqual(customWeights);
    });

    it('falls back to balanced if custom weights invalid', () => {
      const invalidWeights: ScoringWeights = {
        sourceType: 0.5,
        format: 0.3,
        communityRating: 0.1,
        lineage: 0.05,
        taper: 0.01, // Sum = 0.96, not 1.0
      };

      const prefs = {
        ...DEFAULT_PREFERENCES,
        scoring: {
          activePreset: 'custom' as const,
          customWeights: invalidWeights,
        },
      };

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation();

      const weights = getActiveScoringWeights(prefs);
      expect(weights).toEqual(SCORING_PRESETS.balanced.weights);
      expect(consoleWarnSpy).toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });
  });

  describe('updateScoringPreset', () => {
    it('updates the active preset', () => {
      const initial = loadPreferences();
      expect(initial.scoring.activePreset).toBe('balanced');

      const updated = updateScoringPreset(initial, 'audiophile');
      expect(updated.scoring.activePreset).toBe('audiophile');
    });

    it('saves updated preferences to localStorage', () => {
      const prefs = loadPreferences();
      updateScoringPreset(prefs, 'crowd_favorite');

      const loaded = loadPreferences();
      expect(loaded.scoring.activePreset).toBe('crowd_favorite');
    });
  });

  describe('updateCustomWeights', () => {
    it('updates and saves valid custom weights', () => {
      const prefs = loadPreferences();

      const validWeights: ScoringWeights = {
        sourceType: 0.4,
        format: 0.3,
        communityRating: 0.15,
        lineage: 0.1,
        taper: 0.05,
      };

      const result = updateCustomWeights(prefs, validWeights);

      expect(result.success).toBe(true);
      expect(result.preferences.scoring.activePreset).toBe('custom');
      expect(result.preferences.scoring.customWeights).toEqual(validWeights);
    });

    it('rejects invalid weights that do not sum to 1.0', () => {
      const prefs = loadPreferences();

      const invalidWeights: ScoringWeights = {
        sourceType: 0.5,
        format: 0.3,
        communityRating: 0.1,
        lineage: 0.05,
        taper: 0.01, // Sum = 0.96
      };

      const result = updateCustomWeights(prefs, invalidWeights);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Weights must sum to 1.0');
    });

    it('automatically sets preset to custom', () => {
      const prefs = {
        ...DEFAULT_PREFERENCES,
        scoring: { activePreset: 'balanced' as const },
      };

      const validWeights: ScoringWeights = {
        sourceType: 0.2,
        format: 0.2,
        communityRating: 0.2,
        lineage: 0.2,
        taper: 0.2,
      };

      const result = updateCustomWeights(prefs, validWeights);

      expect(result.success).toBe(true);
      expect(result.preferences.scoring.activePreset).toBe('custom');
    });
  });

  describe('updatePlaybackPreferences', () => {
    it('updates playback settings', () => {
      const prefs = loadPreferences();

      const updated = updatePlaybackPreferences(prefs, {
        volume: 0.5,
        autoPlay: true,
      });

      expect(updated.playback.volume).toBe(0.5);
      expect(updated.playback.autoPlay).toBe(true);
      expect(updated.playback.crossfade).toBe(0); // Unchanged
    });

    it('persists changes to localStorage', () => {
      const prefs = loadPreferences();
      updatePlaybackPreferences(prefs, { volume: 0.9 });

      const loaded = loadPreferences();
      expect(loaded.playback.volume).toBe(0.9);
    });
  });

  describe('updateDisplayPreferences', () => {
    it('updates display settings', () => {
      const prefs = loadPreferences();

      const updated = updateDisplayPreferences(prefs, {
        theme: 'light',
        fontSize: 'large',
      });

      expect(updated.display.theme).toBe('light');
      expect(updated.display.fontSize).toBe('large');
    });

    it('persists changes to localStorage', () => {
      const prefs = loadPreferences();
      updateDisplayPreferences(prefs, { theme: 'light' });

      const loaded = loadPreferences();
      expect(loaded.display.theme).toBe('light');
    });
  });

  describe('exportPreferences', () => {
    it('exports preferences as JSON string', () => {
      const prefs = DEFAULT_PREFERENCES;
      const exported = exportPreferences(prefs);

      expect(typeof exported).toBe('string');

      const parsed = JSON.parse(exported);
      expect(parsed).toEqual(DEFAULT_PREFERENCES);
    });

    it('exports custom preferences correctly', () => {
      const custom = {
        ...DEFAULT_PREFERENCES,
        playback: { ...DEFAULT_PREFERENCES.playback, volume: 0.55 },
      };

      const exported = exportPreferences(custom);
      const parsed = JSON.parse(exported);

      expect(parsed.playback.volume).toBe(0.55);
    });
  });

  describe('importPreferences', () => {
    it('imports valid preferences JSON', () => {
      const validPrefs = {
        ...DEFAULT_PREFERENCES,
        playback: { ...DEFAULT_PREFERENCES.playback, volume: 0.6 },
      };

      const json = JSON.stringify(validPrefs);
      const result = importPreferences(json);

      expect(result.success).toBe(true);
      expect(result.preferences?.playback.volume).toBe(0.6);
    });

    it('saves imported preferences to localStorage', () => {
      const validPrefs = {
        ...DEFAULT_PREFERENCES,
        display: { ...DEFAULT_PREFERENCES.display, theme: 'light' as const },
      };

      const json = JSON.stringify(validPrefs);
      importPreferences(json);

      const loaded = loadPreferences();
      expect(loaded.display.theme).toBe('light');
    });

    it('rejects invalid JSON', () => {
      const result = importPreferences('invalid json {');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to parse JSON');
    });

    it('rejects preferences with invalid custom weights', () => {
      const invalidPrefs = {
        ...DEFAULT_PREFERENCES,
        scoring: {
          activePreset: 'custom' as const,
          customWeights: {
            sourceType: 0.5,
            format: 0.3,
            communityRating: 0.1,
            lineage: 0.05,
            taper: 0.01, // Sum != 1.0
          },
        },
      };

      const json = JSON.stringify(invalidPrefs);
      const result = importPreferences(json);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid custom weights');
    });

    it('merges partial imports with defaults', () => {
      const partial = {
        playback: { volume: 0.75 },
      };

      const json = JSON.stringify(partial);
      const result = importPreferences(json);

      expect(result.success).toBe(true);
      expect(result.preferences?.playback.volume).toBe(0.75);
      expect(result.preferences?.scoring.activePreset).toBe('balanced'); // Default
    });
  });
});
