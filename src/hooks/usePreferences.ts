/**
 * React Hook for User Preferences Management
 *
 * Provides reactive access to user preferences with automatic
 * localStorage persistence.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  loadPreferences,
  savePreferences,
  resetPreferences,
  getActiveScoringWeights,
  updateScoringPreset,
  updateCustomWeights,
  updatePlaybackPreferences,
  updateDisplayPreferences,
} from '../services/preferences';
import {
  UserPreferences,
  PresetName,
  ScoringWeights,
} from '../types/preferences';

/**
 * Hook for managing user preferences
 *
 * @returns Preferences state and update functions
 */
export function usePreferences() {
  const [preferences, setPreferences] = useState<UserPreferences>(
    loadPreferences
  );

  // Reload preferences if localStorage changes in another tab
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'deadstream_preferences') {
        setPreferences(loadPreferences());
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Get active scoring weights
  const activeScoringWeights = getActiveScoringWeights(preferences);

  // Update scoring preset
  const setScoringPreset = useCallback((preset: PresetName) => {
    const updated = updateScoringPreset(loadPreferences(), preset);
    setPreferences(updated);
  }, []);

  // Update custom scoring weights
  const setCustomWeights = useCallback((weights: ScoringWeights) => {
    const result = updateCustomWeights(loadPreferences(), weights);
    if (result.success) {
      setPreferences(result.preferences);
    }
    return result;
  }, []);

  // Update playback preferences
  const setPlaybackPreferences = useCallback(
    (updates: Partial<UserPreferences['playback']>) => {
      const updated = updatePlaybackPreferences(loadPreferences(), updates);
      setPreferences(updated);
    },
    []
  );

  // Update display preferences
  const setDisplayPreferences = useCallback(
    (updates: Partial<UserPreferences['display']>) => {
      const updated = updateDisplayPreferences(loadPreferences(), updates);
      setPreferences(updated);
    },
    []
  );

  // Reset to defaults
  const reset = useCallback(() => {
    const defaults = resetPreferences();
    setPreferences(defaults);
  }, []);

  // Manual save (usually not needed as updates auto-save)
  const save = useCallback(() => {
    savePreferences(preferences);
  }, [preferences]);

  return {
    preferences,
    activeScoringWeights,
    setScoringPreset,
    setCustomWeights,
    setPlaybackPreferences,
    setDisplayPreferences,
    reset,
    save,
  };
}

/**
 * Hook for accessing only playback preferences
 * Useful for components that only need playback settings
 */
export function usePlaybackPreferences() {
  const { preferences, setPlaybackPreferences } = usePreferences();
  return {
    playback: preferences.playback,
    setPlaybackPreferences,
  };
}

/**
 * Hook for accessing only display preferences
 * Useful for theme/UI components
 */
export function useDisplayPreferences() {
  const { preferences, setDisplayPreferences } = usePreferences();
  return {
    display: preferences.display,
    setDisplayPreferences,
  };
}

/**
 * Hook for accessing only scoring preferences
 * Useful for recording selection components
 */
export function useScoringPreferences() {
  const {
    preferences,
    activeScoringWeights,
    setScoringPreset,
    setCustomWeights,
  } = usePreferences();

  return {
    scoring: preferences.scoring,
    activeScoringWeights,
    setScoringPreset,
    setCustomWeights,
  };
}
