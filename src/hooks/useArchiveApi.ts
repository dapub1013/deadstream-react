/**
 * React Hooks for Archive.org API Integration
 *
 * These hooks provide React-friendly wrappers around the Archive.org API client.
 * They handle loading states, error handling, and automatic cleanup.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getMetadata,
  extractAudioFiles,
  getShowPlaylist,
  extractRecordingQuality,
  searchShows,
  SearchParams,
} from '../services/archiveApi';
import type {
  AudioTrack,
  ShowPlaylist,
  RecordingQuality,
  ArchiveMetadataResponse,
} from '../types/metadata';
import type { Show } from '../types/show';

/**
 * Hook to fetch metadata for a specific show
 *
 * @param identifier Archive.org identifier (null to skip fetching)
 * @returns Metadata, loading state, and error
 *
 * @example
 * const { metadata, loading, error } = useMetadata(showId);
 */
export function useMetadata(identifier: string | null) {
  const [metadata, setMetadata] = useState<ArchiveMetadataResponse | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Reset state if no identifier
    if (!identifier) {
      setMetadata(null);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    async function fetchMetadata() {
      setLoading(true);
      setError(null);

      try {
        const data = await getMetadata(identifier);

        if (!cancelled) {
          setMetadata(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof Error ? err.message : 'Failed to load metadata';
          setError(message);
          setMetadata(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchMetadata();

    // Cleanup function to prevent state updates after unmount
    return () => {
      cancelled = true;
    };
  }, [identifier]);

  return { metadata, loading, error };
}

/**
 * Hook to fetch audio tracks for a specific show
 *
 * @param identifier Archive.org identifier (null to skip fetching)
 * @returns Audio tracks, loading state, and error
 *
 * @example
 * const { tracks, loading, error } = useAudioTracks('gd1977-05-08...');
 */
export function useAudioTracks(identifier: string | null) {
  const [tracks, setTracks] = useState<AudioTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!identifier) {
      setTracks([]);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    async function fetchTracks() {
      setLoading(true);
      setError(null);

      try {
        const metadata = await getMetadata(identifier);
        const audioFiles = extractAudioFiles(metadata);

        if (!cancelled) {
          setTracks(audioFiles);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof Error ? err.message : 'Failed to load audio tracks';
          setError(message);
          setTracks([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchTracks();

    return () => {
      cancelled = true;
    };
  }, [identifier]);

  return { tracks, loading, error };
}

/**
 * Hook to fetch complete playlist for a show
 *
 * @param identifier Archive.org identifier (null to skip fetching)
 * @returns Playlist, loading state, and error
 *
 * @example
 * const { playlist, loading, error } = usePlaylist('gd1977-05-08...');
 */
export function usePlaylist(identifier: string | null) {
  const [playlist, setPlaylist] = useState<ShowPlaylist | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!identifier) {
      setPlaylist(null);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    async function fetchPlaylist() {
      setLoading(true);
      setError(null);

      try {
        const data = await getShowPlaylist(identifier);

        if (!cancelled) {
          setPlaylist(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof Error ? err.message : 'Failed to load playlist';
          setError(message);
          setPlaylist(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchPlaylist();

    return () => {
      cancelled = true;
    };
  }, [identifier]);

  return { playlist, loading, error };
}

/**
 * Hook to fetch recording quality information
 *
 * @param identifier Archive.org identifier (null to skip fetching)
 * @returns Quality info, loading state, and error
 *
 * @example
 * const { quality, loading, error } = useRecordingQuality('gd1977-05-08...');
 */
export function useRecordingQuality(identifier: string | null) {
  const [quality, setQuality] = useState<RecordingQuality | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!identifier) {
      setQuality(null);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    async function fetchQuality() {
      setLoading(true);
      setError(null);

      try {
        const metadata = await getMetadata(identifier);
        const qualityData = extractRecordingQuality(metadata);

        if (!cancelled) {
          setQuality(qualityData);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof Error
              ? err.message
              : 'Failed to load recording quality';
          setError(message);
          setQuality(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchQuality();

    return () => {
      cancelled = true;
    };
  }, [identifier]);

  return { quality, loading, error };
}

/**
 * Hook to search for shows with dynamic parameters
 *
 * @returns Search function, results, loading state, and error
 *
 * @example
 * const { search, shows, loading, error } = useShowSearch();
 * // Later, in an event handler:
 * search({ date: '1977-05-08' });
 */
export function useShowSearch() {
  const [shows, setShows] = useState<Show[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (params: SearchParams) => {
    setLoading(true);
    setError(null);

    try {
      const results = await searchShows(params);
      setShows(results);
      setError(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to search shows';
      setError(message);
      setShows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setShows([]);
    setError(null);
    setLoading(false);
  }, []);

  return { search, shows, loading, error, reset };
}

/**
 * Hook to search for shows with automatic fetching on parameter change
 *
 * @param params Search parameters
 * @returns Shows, loading state, and error
 *
 * @example
 * const { shows, loading, error } = useAutoShowSearch({ year: 1977 });
 */
export function useAutoShowSearch(params: SearchParams | null) {
  const [shows, setShows] = useState<Show[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params) {
      setShows([]);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    async function fetchShows() {
      setLoading(true);
      setError(null);

      try {
        const results = await searchShows(params);

        if (!cancelled) {
          setShows(results);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof Error ? err.message : 'Failed to search shows';
          setError(message);
          setShows([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchShows();

    return () => {
      cancelled = true;
    };
  }, [params?.date, params?.year, params?.venue, params?.query, params?.rows]);

  return { shows, loading, error };
}
