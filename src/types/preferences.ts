/**
 * User preferences for recording selection and scoring
 */

export interface ScoringWeights {
  sourceType: number;      // SBD vs AUD vs Matrix (0-1)
  format: number;          // FLAC > MP3 320 > MP3 128 (0-1)
  communityRating: number; // avg_rating + num_reviews (0-1)
  lineage: number;         // Fewer generations = better (0-1)
  taper: number;           // Known tapers bonus (0-1)
}

export type PresetName = 'balanced' | 'audiophile' | 'crowd_favorite' | 'custom';

export interface ScoringPreset {
  name: PresetName;
  description: string;
  weights: ScoringWeights;
}

export interface UserPreferences {
  scoring: {
    activePreset: PresetName;
    customWeights?: ScoringWeights;
  };
  playback: {
    volume: number;           // 0.0 - 1.0
    autoPlay: boolean;        // Auto-play on show selection
    crossfade: number;        // Crossfade duration in ms (0 = off)
  };
  display: {
    theme: 'light' | 'dark';
    fontSize: 'normal' | 'large';
  };
}

/**
 * Default scoring presets
 */
export const SCORING_PRESETS: Record<PresetName, ScoringPreset> = {
  balanced: {
    name: 'balanced',
    description: 'Balanced mix of quality and community preference',
    weights: {
      sourceType: 0.35,
      format: 0.25,
      communityRating: 0.20,
      lineage: 0.10,
      taper: 0.10,
    },
  },
  audiophile: {
    name: 'audiophile',
    description: 'Prioritizes technical quality (format, source, lineage)',
    weights: {
      sourceType: 0.40,
      format: 0.35,
      communityRating: 0.05,
      lineage: 0.15,
      taper: 0.05,
    },
  },
  crowd_favorite: {
    name: 'crowd_favorite',
    description: 'Prioritizes community ratings and reviews',
    weights: {
      sourceType: 0.20,
      format: 0.15,
      communityRating: 0.50,
      lineage: 0.05,
      taper: 0.10,
    },
  },
  custom: {
    name: 'custom',
    description: 'User-defined custom weights',
    weights: {
      sourceType: 0.35,
      format: 0.25,
      communityRating: 0.20,
      lineage: 0.10,
      taper: 0.10,
    },
  },
};

/**
 * Default user preferences
 */
export const DEFAULT_PREFERENCES: UserPreferences = {
  scoring: {
    activePreset: 'balanced',
  },
  playback: {
    volume: 0.8,
    autoPlay: false,
    crossfade: 0,
  },
  display: {
    theme: 'dark',
    fontSize: 'normal',
  },
};

/**
 * Validate that scoring weights sum to 1.0 (within tolerance)
 */
export function validateScoringWeights(weights: ScoringWeights): boolean {
  const sum =
    weights.sourceType +
    weights.format +
    weights.communityRating +
    weights.lineage +
    weights.taper;

  const tolerance = 0.001;
  return Math.abs(sum - 1.0) < tolerance;
}
