/**
 * React Hook for Recording Selection
 *
 * Provides functionality to select the best recording for a show
 * based on user preferences and scoring algorithm.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  selectBestRecordingForDate,
  getRecordingOptionsForDate,
  getRecordingScoreBreakdown,
} from '../services/recordingSelector';
import { RecordingQuality } from '../types/metadata';
import { Show } from '../types/show';
import { ScoringWeights } from '../types/preferences';
import { useScoringPreferences } from './usePreferences';

/**
 * Hook for selecting the best recording for a specific date
 *
 * @param date Show date (YYYY-MM-DD) or null
 * @param fetchMetadata Whether to fetch full metadata (slower but more accurate)
 * @returns Best recording, loading state, and error
 */
export function useBestRecording(
  date: string | null,
  fetchMetadata = true
) {
  const { activeScoringWeights } = useScoringPreferences();
  const [recording, setRecording] = useState<
    (RecordingQuality & { score: number; show: Show }) | null
  >(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!date) {
      setRecording(null);
      return;
    }

    let cancelled = false;

    async function fetchBest() {
      setLoading(true);
      setError(null);

      try {
        const best = await selectBestRecordingForDate(
          date,
          activeScoringWeights,
          fetchMetadata
        );

        if (!cancelled) {
          setRecording(best);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'Failed to select recording'
          );
          setRecording(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchBest();

    return () => {
      cancelled = true;
    };
  }, [date, activeScoringWeights, fetchMetadata]);

  return { recording, loading, error };
}

/**
 * Hook for getting all recording options for a specific date
 *
 * @param date Show date (YYYY-MM-DD) or null
 * @param fetchMetadata Whether to fetch full metadata
 * @returns All recordings sorted by score, loading state, and error
 */
export function useRecordingOptions(
  date: string | null,
  fetchMetadata = true
) {
  const { activeScoringWeights } = useScoringPreferences();
  const [recordings, setRecordings] = useState<
    Array<RecordingQuality & { score: number; show: Show }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!date) {
      setRecordings([]);
      return;
    }

    let cancelled = false;

    async function fetchOptions() {
      setLoading(true);
      setError(null);

      try {
        const options = await getRecordingOptionsForDate(
          date,
          activeScoringWeights,
          fetchMetadata
        );

        if (!cancelled) {
          setRecordings(options);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'Failed to load recordings'
          );
          setRecordings([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchOptions();

    return () => {
      cancelled = true;
    };
  }, [date, activeScoringWeights, fetchMetadata]);

  return { recordings, loading, error };
}

/**
 * Hook for manual recording selection with custom weights
 *
 * Allows overriding user preferences for one-time selections
 */
export function useManualRecordingSelector() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectBest = useCallback(
    async (date: string, weights: ScoringWeights, fetchMetadata = true) => {
      setLoading(true);
      setError(null);

      try {
        const best = await selectBestRecordingForDate(
          date,
          weights,
          fetchMetadata
        );
        return best;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to select recording'
        );
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const getOptions = useCallback(
    async (date: string, weights: ScoringWeights, fetchMetadata = true) => {
      setLoading(true);
      setError(null);

      try {
        const options = await getRecordingOptionsForDate(
          date,
          weights,
          fetchMetadata
        );
        return options;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load recordings'
        );
        return [];
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { selectBest, getOptions, loading, error };
}

/**
 * Hook for getting score breakdown for a recording
 * Useful for debugging or showing user why a recording was selected
 */
export function useScoreBreakdown(recording: RecordingQuality | null) {
  const { activeScoringWeights } = useScoringPreferences();
  const [breakdown, setBreakdown] = useState<ReturnType<
    typeof getRecordingScoreBreakdown
  > | null>(null);

  useEffect(() => {
    if (!recording) {
      setBreakdown(null);
      return;
    }

    const result = getRecordingScoreBreakdown(
      recording,
      activeScoringWeights
    );
    setBreakdown(result);
  }, [recording, activeScoringWeights]);

  return breakdown;
}
