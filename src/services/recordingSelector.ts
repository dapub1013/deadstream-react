/**
 * Recording Selector Service
 *
 * High-level service for selecting the best recording when multiple
 * versions of the same show exist in the Archive.org collection.
 *
 * Responsibilities:
 * - Fetch all recordings for a given date
 * - Extract quality metadata from Archive.org responses
 * - Score recordings using the scoring engine
 * - Return the best recording or provide options for manual selection
 */

import { db } from './database';
import { getMetadata } from './archiveApi';
import { RecordingQuality, ArchiveMetadataResponse } from '../types/metadata';
import { Show } from '../types/show';
import { ScoringWeights } from '../types/preferences';
import {
  scoreAndSortRecordings,
  selectBestRecording,
  getScoreBreakdown,
} from './scoringEngine';

/**
 * Get all shows (recordings) for a specific date from database
 */
export async function getRecordingsForDate(date: string): Promise<Show[]> {
  return db.shows.where('date').equals(date).toArray();
}

/**
 * Extract recording quality metadata from Archive.org metadata response
 */
export function extractRecordingQuality(
  show: Show,
  metadata?: ArchiveMetadataResponse
): RecordingQuality {
  // If metadata provided, extract detailed info
  if (metadata) {
    const meta = metadata.metadata;

    // Determine source type from metadata
    let sourceType: 'sbd' | 'aud' | 'matrix' | 'unknown' = 'unknown';
    const source = meta.source?.toLowerCase() || '';
    const title = meta.title?.toLowerCase() || '';

    if (source.includes('sbd') || source.includes('soundboard')) {
      sourceType = 'sbd';
    } else if (source.includes('matrix')) {
      sourceType = 'matrix';
    } else if (source.includes('aud') || source.includes('audience')) {
      sourceType = 'aud';
    } else if (title.includes('sbd') || title.includes('soundboard')) {
      sourceType = 'sbd';
    } else if (title.includes('matrix')) {
      sourceType = 'matrix';
    } else if (title.includes('aud') || title.includes('audience')) {
      sourceType = 'aud';
    }

    // Extract format from files (prefer FLAC > VBR MP3 > MP3)
    let format = 'MP3'; // Default
    const audioFiles = metadata.files.filter(
      (f) =>
        f.format === 'Flac' ||
        f.format === 'VBR MP3' ||
        f.format === 'Ogg Vorbis' ||
        f.format === 'MP3'
    );

    if (audioFiles.some((f) => f.format === 'Flac')) {
      format = 'FLAC';
    } else if (audioFiles.some((f) => f.format === 'VBR MP3')) {
      format = 'VBR MP3';
    } else if (audioFiles.some((f) => f.format === 'Ogg Vorbis')) {
      format = 'Ogg Vorbis';
    }

    return {
      identifier: show.identifier,
      sourceType,
      taper: meta.taper || show.taper || null,
      transferer: meta.transferer || null,
      lineage: meta.lineage || null,
      avgRating: parseFloat(meta.avg_rating || '0') || show.avgRating,
      numReviews: parseInt(meta.num_reviews || '0', 10) || show.numReviews,
      format,
    };
  }

  // Fallback: use show database info only
  return {
    identifier: show.identifier,
    sourceType: show.sourceType || 'unknown',
    taper: show.taper,
    transferer: null,
    lineage: null,
    avgRating: show.avgRating,
    numReviews: show.numReviews,
    format: 'MP3', // Assume MP3 if no metadata
  };
}

/**
 * Fetch detailed metadata for multiple shows in parallel
 * Returns a map of identifier -> RecordingQuality
 */
export async function fetchRecordingQualities(
  shows: Show[]
): Promise<Map<string, RecordingQuality>> {
  const qualities = new Map<string, RecordingQuality>();

  // Fetch metadata for all shows in parallel (with rate limiting handled by archiveApi)
  const metadataPromises = shows.map(async (show) => {
    try {
      const metadata = await getMetadata(show.identifier);
      return { show, metadata };
    } catch (error) {
      console.warn(
        `[RecordingSelector] Failed to fetch metadata for ${show.identifier}:`,
        error
      );
      return { show, metadata: null };
    }
  });

  const results = await Promise.all(metadataPromises);

  // Extract quality info from each result
  for (const { show, metadata } of results) {
    const quality = extractRecordingQuality(
      show,
      metadata || undefined
    );
    qualities.set(show.identifier, quality);
  }

  return qualities;
}

/**
 * Select the best recording for a specific date
 *
 * @param date Show date (YYYY-MM-DD)
 * @param weights Scoring weights
 * @param fetchMetadata Whether to fetch full metadata (slower but more accurate)
 * @returns Best recording with score, or null if no shows found
 */
export async function selectBestRecordingForDate(
  date: string,
  weights: ScoringWeights,
  fetchMetadata = true
): Promise<(RecordingQuality & { score: number; show: Show }) | null> {
  // Get all shows for this date
  const shows = await getRecordingsForDate(date);

  if (shows.length === 0) {
    return null;
  }

  // If only one show, return it without scoring
  if (shows.length === 1) {
    const quality = extractRecordingQuality(shows[0]);
    const scored = selectBestRecording([quality], weights);
    return scored ? { ...scored, show: shows[0] } : null;
  }

  // Multiple recordings - need to score them
  let recordings: RecordingQuality[];

  if (fetchMetadata) {
    // Fetch detailed metadata for accurate scoring
    const qualities = await fetchRecordingQualities(shows);
    recordings = Array.from(qualities.values());
  } else {
    // Use database info only (faster but less accurate)
    recordings = shows.map((show) => extractRecordingQuality(show));
  }

  // Score and select best
  const best = selectBestRecording(recordings, weights);

  if (!best) {
    return null;
  }

  // Find corresponding show
  const show = shows.find((s) => s.identifier === best.identifier);

  return show ? { ...best, show } : null;
}

/**
 * Get all recording options for a date, sorted by score
 *
 * @param date Show date (YYYY-MM-DD)
 * @param weights Scoring weights
 * @param fetchMetadata Whether to fetch full metadata
 * @returns Array of recordings with scores, sorted best to worst
 */
export async function getRecordingOptionsForDate(
  date: string,
  weights: ScoringWeights,
  fetchMetadata = true
): Promise<Array<RecordingQuality & { score: number; show: Show }>> {
  // Get all shows for this date
  const shows = await getRecordingsForDate(date);

  if (shows.length === 0) {
    return [];
  }

  // Get recording qualities
  let recordings: RecordingQuality[];

  if (fetchMetadata) {
    const qualities = await fetchRecordingQualities(shows);
    recordings = Array.from(qualities.values());
  } else {
    recordings = shows.map((show) => extractRecordingQuality(show));
  }

  // Score and sort
  const scored = scoreAndSortRecordings(recordings, weights);

  // Attach show data
  return scored.map((rec) => {
    const show = shows.find((s) => s.identifier === rec.identifier)!;
    return { ...rec, show };
  });
}

/**
 * Get detailed score breakdown for a recording (for debugging/transparency)
 */
export function getRecordingScoreBreakdown(
  recording: RecordingQuality,
  weights: ScoringWeights
) {
  return getScoreBreakdown(recording, weights);
}

/**
 * Compare two recordings side-by-side
 *
 * @param recording1 First recording
 * @param recording2 Second recording
 * @param weights Scoring weights
 * @returns Comparison object with scores and breakdown
 */
export function compareRecordings(
  recording1: RecordingQuality,
  recording2: RecordingQuality,
  weights: ScoringWeights
): {
  recording1: ReturnType<typeof getScoreBreakdown>;
  recording2: ReturnType<typeof getScoreBreakdown>;
  winner: 'recording1' | 'recording2' | 'tie';
} {
  const breakdown1 = getScoreBreakdown(recording1, weights);
  const breakdown2 = getScoreBreakdown(recording2, weights);

  let winner: 'recording1' | 'recording2' | 'tie';
  if (breakdown1.finalScore > breakdown2.finalScore) {
    winner = 'recording1';
  } else if (breakdown2.finalScore > breakdown1.finalScore) {
    winner = 'recording2';
  } else {
    winner = 'tie';
  }

  return {
    recording1: breakdown1,
    recording2: breakdown2,
    winner,
  };
}
