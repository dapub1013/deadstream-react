/**
 * User Preferences Management Service
 *
 * Handles loading, saving, and validating user preferences.
 * Uses localStorage for persistence across browser sessions.
 *
 * Preferences include:
 * - Scoring weights for recording selection
 * - Playback settings (volume, auto-play, crossfade)
 * - Display preferences (theme, font size)
 */

import {
  UserPreferences,
  DEFAULT_PREFERENCES,
  ScoringWeights,
  PresetName,
  SCORING_PRESETS,
  validateScoringWeights,
} from '../types/preferences';

const STORAGE_KEY = 'deadstream_preferences';

/**
 * Load preferences from localStorage
 * Returns default preferences if none exist or if parsing fails
 */
export function loadPreferences(): UserPreferences {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return { ...DEFAULT_PREFERENCES };
    }

    const parsed = JSON.parse(stored) as UserPreferences;

    // Validate structure and merge with defaults (in case new fields added)
    return {
      scoring: {
        activePreset: parsed.scoring?.activePreset || DEFAULT_PREFERENCES.scoring.activePreset,
        customWeights: parsed.scoring?.customWeights,
      },
      playback: {
        volume: parsed.playback?.volume ?? DEFAULT_PREFERENCES.playback.volume,
        autoPlay: parsed.playback?.autoPlay ?? DEFAULT_PREFERENCES.playback.autoPlay,
        crossfade: parsed.playback?.crossfade ?? DEFAULT_PREFERENCES.playback.crossfade,
      },
      display: {
        theme: parsed.display?.theme || DEFAULT_PREFERENCES.display.theme,
        fontSize: parsed.display?.fontSize || DEFAULT_PREFERENCES.display.fontSize,
      },
    };
  } catch (error) {
    console.error('[Preferences] Failed to load preferences:', error);
    return { ...DEFAULT_PREFERENCES };
  }
}

/**
 * Save preferences to localStorage
 */
export function savePreferences(preferences: UserPreferences): boolean {
  try {
    const serialized = JSON.stringify(preferences, null, 2);
    localStorage.setItem(STORAGE_KEY, serialized);
    return true;
  } catch (error) {
    console.error('[Preferences] Failed to save preferences:', error);
    return false;
  }
}

/**
 * Reset preferences to defaults
 */
export function resetPreferences(): UserPreferences {
  const defaults = { ...DEFAULT_PREFERENCES };
  savePreferences(defaults);
  return defaults;
}

/**
 * Get active scoring weights based on current preset
 */
export function getActiveScoringWeights(
  preferences: UserPreferences
): ScoringWeights {
  const { activePreset, customWeights } = preferences.scoring;

  if (activePreset === 'custom' && customWeights) {
    // Validate custom weights before using
    if (validateScoringWeights(customWeights)) {
      return customWeights;
    } else {
      console.warn('[Preferences] Custom weights invalid, using balanced preset');
      return SCORING_PRESETS.balanced.weights;
    }
  }

  // Return preset weights
  return SCORING_PRESETS[activePreset].weights;
}

/**
 * Update scoring preset
 */
export function updateScoringPreset(
  preferences: UserPreferences,
  preset: PresetName
): UserPreferences {
  const updated = {
    ...preferences,
    scoring: {
      ...preferences.scoring,
      activePreset: preset,
    },
  };

  savePreferences(updated);
  return updated;
}

/**
 * Update custom scoring weights
 * Validates weights before saving
 */
export function updateCustomWeights(
  preferences: UserPreferences,
  weights: ScoringWeights
): { success: boolean; preferences: UserPreferences; error?: string } {
  // Validate weights sum to 1.0
  if (!validateScoringWeights(weights)) {
    return {
      success: false,
      preferences,
      error: 'Weights must sum to 1.0',
    };
  }

  const updated = {
    ...preferences,
    scoring: {
      activePreset: 'custom' as PresetName,
      customWeights: weights,
    },
  };

  savePreferences(updated);

  return {
    success: true,
    preferences: updated,
  };
}

/**
 * Update playback preferences
 */
export function updatePlaybackPreferences(
  preferences: UserPreferences,
  updates: Partial<UserPreferences['playback']>
): UserPreferences {
  const updated = {
    ...preferences,
    playback: {
      ...preferences.playback,
      ...updates,
    },
  };

  savePreferences(updated);
  return updated;
}

/**
 * Update display preferences
 */
export function updateDisplayPreferences(
  preferences: UserPreferences,
  updates: Partial<UserPreferences['display']>
): UserPreferences {
  const updated = {
    ...preferences,
    display: {
      ...preferences.display,
      ...updates,
    },
  };

  savePreferences(updated);
  return updated;
}

/**
 * Export preferences as JSON string (for backup/sharing)
 */
export function exportPreferences(preferences: UserPreferences): string {
  return JSON.stringify(preferences, null, 2);
}

/**
 * Import preferences from JSON string
 */
export function importPreferences(json: string): {
  success: boolean;
  preferences?: UserPreferences;
  error?: string;
} {
  try {
    const parsed = JSON.parse(json) as UserPreferences;

    // Validate custom weights if present
    if (
      parsed.scoring?.activePreset === 'custom' &&
      parsed.scoring?.customWeights
    ) {
      if (!validateScoringWeights(parsed.scoring.customWeights)) {
        return {
          success: false,
          error: 'Invalid custom weights in import (must sum to 1.0)',
        };
      }
    }

    // Merge with defaults to ensure all fields present
    const validated: UserPreferences = {
      scoring: {
        activePreset: parsed.scoring?.activePreset || DEFAULT_PREFERENCES.scoring.activePreset,
        customWeights: parsed.scoring?.customWeights,
      },
      playback: {
        volume: parsed.playback?.volume ?? DEFAULT_PREFERENCES.playback.volume,
        autoPlay: parsed.playback?.autoPlay ?? DEFAULT_PREFERENCES.playback.autoPlay,
        crossfade: parsed.playback?.crossfade ?? DEFAULT_PREFERENCES.playback.crossfade,
      },
      display: {
        theme: parsed.display?.theme || DEFAULT_PREFERENCES.display.theme,
        fontSize: parsed.display?.fontSize || DEFAULT_PREFERENCES.display.fontSize,
      },
    };

    savePreferences(validated);

    return {
      success: true,
      preferences: validated,
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to parse JSON: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}
