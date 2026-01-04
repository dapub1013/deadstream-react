/**
 * Recording Quality Scoring Engine
 *
 * Implements the smart selection algorithm for choosing the best recording
 * when multiple versions of the same show exist.
 *
 * Scoring Components (sum to 100):
 * - Source Type (35%): SBD > Matrix > AUD
 * - Format (25%): FLAC > MP3 320 > MP3 128
 * - Community Rating (20%): avg_rating + num_reviews weight
 * - Lineage (10%): Fewer generations = better
 * - Taper (10%): Known reputable tapers get bonus
 *
 * Ported from PyQt5 implementation (src/selection/scoring.py)
 */

import { RecordingQuality } from '../types/metadata';
import { ScoringWeights } from '../types/preferences';

/**
 * Known reputable tapers (partial list - can be extended)
 * These names get bonus points in taper scoring
 */
const KNOWN_TAPERS = new Set([
  'betty boards',
  'betty board',
  'charlie miller',
  'miller',
  'dick latvala',
  'latvala',
  'dan healy',
  'healy',
  'vault',
  'bear',
  'owsley',
  'ultramatrix',
  'seamons',
  'bertrando',
  'clarke',
  'tobin',
  'scotton',
  'wagner',
  'miner',
]);

/**
 * Score source type quality (0-100)
 * SBD (soundboard) > Matrix > AUD (audience)
 */
export function scoreSourceType(sourceType: string | null): number {
  if (!sourceType) return 0;

  const normalized = sourceType.toLowerCase().trim();

  if (normalized.includes('sbd') || normalized.includes('soundboard')) {
    return 100;
  }

  if (normalized.includes('matrix')) {
    return 70;
  }

  if (normalized.includes('aud') || normalized.includes('audience')) {
    return 40;
  }

  // Unknown source type gets middle score
  return 50;
}

/**
 * Score audio format quality (0-100)
 * FLAC/Lossless > VBR MP3 > 320kbps MP3 > 256kbps > 192kbps > 128kbps
 */
export function scoreFormat(format: string): number {
  if (!format) return 0;

  const normalized = format.toLowerCase().trim();

  // Lossless formats
  if (
    normalized.includes('flac') ||
    normalized.includes('shn') ||
    normalized.includes('ape')
  ) {
    return 100;
  }

  // High quality lossy
  if (normalized.includes('vbr')) {
    return 85;
  }

  // Extract bitrate if mentioned
  const bitrateMatch = normalized.match(/(\d+)\s*k/);
  if (bitrateMatch) {
    const bitrate = parseInt(bitrateMatch[1], 10);
    if (bitrate >= 320) return 90;
    if (bitrate >= 256) return 75;
    if (bitrate >= 192) return 60;
    if (bitrate >= 128) return 45;
    return 30;
  }

  // Generic MP3/Ogg
  if (normalized.includes('mp3')) {
    return 70; // Assume decent quality if not specified
  }

  if (normalized.includes('ogg') || normalized.includes('vorbis')) {
    return 75;
  }

  // Unknown format
  return 50;
}

/**
 * Score community rating (0-100)
 * Combines average rating (stars) with review count (confidence)
 */
export function scoreCommunityRating(
  avgRating: number,
  numReviews: number
): number {
  // Normalize rating to 0-100 (assuming 5-star system)
  const ratingScore = (avgRating / 5.0) * 100;

  // Review count contributes to confidence
  // Diminishing returns: log scale to prevent dominance
  // 0 reviews = 0% confidence, 100+ reviews = 100% confidence
  const confidenceMultiplier = Math.min(1.0, Math.log10(numReviews + 1) / 2);

  // Combine: rating weighted by confidence
  // Low reviews = lower impact, high reviews = full impact
  return ratingScore * (0.5 + 0.5 * confidenceMultiplier);
}

/**
 * Score lineage quality (0-100)
 * Fewer generations = better quality preservation
 *
 * Examples:
 * - "master" = 100
 * - "m1" or "1st gen" = 90
 * - "m2" or "2nd gen" = 75
 * - "m3" or "3rd gen" = 60
 * - Unknown = 50 (neutral)
 */
export function scoreLineage(lineage: string | null): number {
  if (!lineage) return 50; // Neutral score for unknown

  const normalized = lineage.toLowerCase().trim();

  // Master/original recording
  if (normalized.includes('master') || normalized.includes('original')) {
    return 100;
  }

  // Extract generation number (m1, m2, 1st gen, etc.)
  const genMatch = normalized.match(/m(\d+)|(\d+)(?:st|nd|rd|th)\s*gen/);
  if (genMatch) {
    const genNumber = parseInt(genMatch[1] || genMatch[2], 10);

    if (genNumber === 1) return 90;
    if (genNumber === 2) return 75;
    if (genNumber === 3) return 60;
    if (genNumber === 4) return 45;
    return Math.max(30, 90 - genNumber * 15); // Diminishing returns
  }

  // If lineage string exists but can't parse, assume reasonable quality
  return 60;
}

/**
 * Score taper reputation (0-100)
 * Known reputable tapers get bonus points
 */
export function scoreTaper(taper: string | null): number {
  if (!taper) return 50; // Neutral score for unknown

  const normalized = taper.toLowerCase().trim();

  // Check against known taper list
  for (const knownTaper of KNOWN_TAPERS) {
    if (normalized.includes(knownTaper)) {
      return 100;
    }
  }

  // Unknown taper - neutral score
  // (Not penalizing, just not giving bonus)
  return 50;
}

/**
 * Calculate composite score for a recording
 *
 * @param recording Recording quality metadata
 * @param weights Scoring weights (must sum to 1.0)
 * @returns Final score (0-100)
 */
export function scoreRecording(
  recording: RecordingQuality,
  weights: ScoringWeights
): number {
  const sourceScore = scoreSourceType(recording.sourceType) * weights.sourceType;
  const formatScore = scoreFormat(recording.format) * weights.format;
  const ratingScore =
    scoreCommunityRating(recording.avgRating, recording.numReviews) *
    weights.communityRating;
  const lineageScore = scoreLineage(recording.lineage) * weights.lineage;
  const taperScore = scoreTaper(recording.taper) * weights.taper;

  const totalScore =
    sourceScore + formatScore + ratingScore + lineageScore + taperScore;

  return Math.round(totalScore * 100) / 100; // Round to 2 decimal places
}

/**
 * Score multiple recordings and return them sorted by score (highest first)
 *
 * @param recordings Array of recordings to score
 * @param weights Scoring weights
 * @returns Array of recordings with scores, sorted best to worst
 */
export function scoreAndSortRecordings(
  recordings: RecordingQuality[],
  weights: ScoringWeights
): Array<RecordingQuality & { score: number }> {
  const scored = recordings.map((recording) => ({
    ...recording,
    score: scoreRecording(recording, weights),
  }));

  // Sort by score descending (highest first)
  scored.sort((a, b) => b.score - a.score);

  return scored;
}

/**
 * Get the best recording from a list
 *
 * @param recordings Array of recordings
 * @param weights Scoring weights
 * @returns The best recording (highest score)
 */
export function selectBestRecording(
  recordings: RecordingQuality[],
  weights: ScoringWeights
): (RecordingQuality & { score: number }) | null {
  if (recordings.length === 0) return null;

  const scored = scoreAndSortRecordings(recordings, weights);
  return scored[0];
}

/**
 * Generate a detailed scoring breakdown for debugging/transparency
 *
 * @param recording Recording to analyze
 * @param weights Scoring weights
 * @returns Object with component scores and final score
 */
export function getScoreBreakdown(
  recording: RecordingQuality,
  weights: ScoringWeights
): {
  components: {
    sourceType: { raw: number; weighted: number; weight: number };
    format: { raw: number; weighted: number; weight: number };
    communityRating: { raw: number; weighted: number; weight: number };
    lineage: { raw: number; weighted: number; weight: number };
    taper: { raw: number; weighted: number; weight: number };
  };
  finalScore: number;
} {
  const sourceRaw = scoreSourceType(recording.sourceType);
  const formatRaw = scoreFormat(recording.format);
  const ratingRaw = scoreCommunityRating(
    recording.avgRating,
    recording.numReviews
  );
  const lineageRaw = scoreLineage(recording.lineage);
  const taperRaw = scoreTaper(recording.taper);

  return {
    components: {
      sourceType: {
        raw: sourceRaw,
        weighted: sourceRaw * weights.sourceType,
        weight: weights.sourceType,
      },
      format: {
        raw: formatRaw,
        weighted: formatRaw * weights.format,
        weight: weights.format,
      },
      communityRating: {
        raw: ratingRaw,
        weighted: ratingRaw * weights.communityRating,
        weight: weights.communityRating,
      },
      lineage: {
        raw: lineageRaw,
        weighted: lineageRaw * weights.lineage,
        weight: weights.lineage,
      },
      taper: {
        raw: taperRaw,
        weighted: taperRaw * weights.taper,
        weight: weights.taper,
      },
    },
    finalScore: scoreRecording(recording, weights),
  };
}
