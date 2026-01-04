/**
 * Tests for Recording Quality Scoring Engine
 */

import { describe, it, expect } from 'vitest';
import {
  scoreSourceType,
  scoreFormat,
  scoreCommunityRating,
  scoreLineage,
  scoreTaper,
  scoreRecording,
  scoreAndSortRecordings,
  selectBestRecording,
  getScoreBreakdown,
} from './scoringEngine';
import { RecordingQuality } from '../types/metadata';
import { ScoringWeights, SCORING_PRESETS } from '../types/preferences';

describe('Scoring Engine - Component Scores', () => {
  describe('scoreSourceType', () => {
    it('scores soundboard highest (100)', () => {
      expect(scoreSourceType('sbd')).toBe(100);
      expect(scoreSourceType('soundboard')).toBe(100);
      expect(scoreSourceType('SBD')).toBe(100);
      expect(scoreSourceType('Soundboard Recording')).toBe(100);
    });

    it('scores matrix medium-high (70)', () => {
      expect(scoreSourceType('matrix')).toBe(70);
      expect(scoreSourceType('Matrix')).toBe(70);
      expect(scoreSourceType('ultra-matrix')).toBe(70);
    });

    it('scores audience lower (40)', () => {
      expect(scoreSourceType('aud')).toBe(40);
      expect(scoreSourceType('audience')).toBe(40);
      expect(scoreSourceType('AUD')).toBe(40);
    });

    it('scores unknown as neutral (50)', () => {
      expect(scoreSourceType('unknown')).toBe(50);
      expect(scoreSourceType('radio')).toBe(50);
      expect(scoreSourceType(null)).toBe(0);
    });
  });

  describe('scoreFormat', () => {
    it('scores lossless formats highest (100)', () => {
      expect(scoreFormat('Flac')).toBe(100);
      expect(scoreFormat('FLAC')).toBe(100);
      expect(scoreFormat('SHN')).toBe(100);
      expect(scoreFormat('APE')).toBe(100);
    });

    it('scores VBR MP3 high (85)', () => {
      expect(scoreFormat('VBR MP3')).toBe(85);
      expect(scoreFormat('vbr mp3')).toBe(85);
    });

    it('scores high-bitrate MP3 appropriately', () => {
      expect(scoreFormat('320k MP3')).toBe(90);
      expect(scoreFormat('MP3 320kbps')).toBe(90);
      expect(scoreFormat('256k MP3')).toBe(75);
      expect(scoreFormat('192k MP3')).toBe(60);
      expect(scoreFormat('128k MP3')).toBe(45);
    });

    it('scores Ogg Vorbis (75)', () => {
      expect(scoreFormat('Ogg Vorbis')).toBe(75);
      expect(scoreFormat('ogg')).toBe(75);
    });

    it('scores generic MP3 as decent (70)', () => {
      expect(scoreFormat('MP3')).toBe(70);
      expect(scoreFormat('mp3')).toBe(70);
    });

    it('scores unknown format as neutral (50)', () => {
      expect(scoreFormat('Unknown')).toBe(50);
      expect(scoreFormat('')).toBe(0);
    });
  });

  describe('scoreCommunityRating', () => {
    it('scores perfect rating with many reviews highest', () => {
      const score = scoreCommunityRating(5.0, 100);
      expect(score).toBeCloseTo(100, 0);
    });

    it('scores good rating with many reviews high', () => {
      const score = scoreCommunityRating(4.5, 100);
      expect(score).toBeCloseTo(90, 0);
    });

    it('reduces score for low review count (less confidence)', () => {
      const highReviews = scoreCommunityRating(4.5, 100);
      const lowReviews = scoreCommunityRating(4.5, 5);

      expect(lowReviews).toBeLessThan(highReviews);
    });

    it('scores zero reviews as low', () => {
      const score = scoreCommunityRating(5.0, 0);
      expect(score).toBeLessThan(60);
    });

    it('scores poor rating low even with many reviews', () => {
      const score = scoreCommunityRating(2.0, 100);
      expect(score).toBeLessThan(50);
    });
  });

  describe('scoreLineage', () => {
    it('scores master/original highest (100)', () => {
      expect(scoreLineage('master')).toBe(100);
      expect(scoreLineage('Master Recording')).toBe(100);
      expect(scoreLineage('original')).toBe(100);
    });

    it('scores first generation high (90)', () => {
      expect(scoreLineage('m1')).toBe(90);
      expect(scoreLineage('M1')).toBe(90);
      expect(scoreLineage('1st gen')).toBe(90);
      expect(scoreLineage('1st generation')).toBe(90);
    });

    it('scores second generation good (75)', () => {
      expect(scoreLineage('m2')).toBe(75);
      expect(scoreLineage('2nd gen')).toBe(75);
    });

    it('scores third generation fair (60)', () => {
      expect(scoreLineage('m3')).toBe(60);
      expect(scoreLineage('3rd gen')).toBe(60);
    });

    it('scores unknown lineage as neutral (50)', () => {
      expect(scoreLineage(null)).toBe(50);
    });

    it('gives unparseable lineage benefit of doubt (60)', () => {
      expect(scoreLineage('some transfer info')).toBe(60);
    });
  });

  describe('scoreTaper', () => {
    it('scores known reputable tapers highest (100)', () => {
      expect(scoreTaper('Betty Boards')).toBe(100);
      expect(scoreTaper('betty board')).toBe(100);
      expect(scoreTaper('Charlie Miller')).toBe(100);
      expect(scoreTaper('miller')).toBe(100);
      expect(scoreTaper('Dick Latvala')).toBe(100);
      expect(scoreTaper('Ultramatrix')).toBe(100);
    });

    it('scores unknown taper as neutral (50)', () => {
      expect(scoreTaper('Unknown Taper')).toBe(50);
      expect(scoreTaper('John Doe')).toBe(50);
      expect(scoreTaper(null)).toBe(50);
    });

    it('matches known tapers case-insensitively', () => {
      expect(scoreTaper('CHARLIE MILLER')).toBe(100);
      expect(scoreTaper('betty boards')).toBe(100);
    });
  });
});

describe('Scoring Engine - Composite Scoring', () => {
  const balancedWeights: ScoringWeights = SCORING_PRESETS.balanced.weights;

  const createTestRecording = (
    overrides: Partial<RecordingQuality> = {}
  ): RecordingQuality => ({
    identifier: 'test-recording',
    sourceType: 'sbd',
    taper: 'Charlie Miller',
    transferer: null,
    lineage: 'm1',
    avgRating: 4.5,
    numReviews: 100,
    format: 'FLAC',
    ...overrides,
  });

  describe('scoreRecording', () => {
    it('scores a perfect recording near 100', () => {
      const perfect = createTestRecording({
        sourceType: 'sbd',
        format: 'FLAC',
        avgRating: 5.0,
        numReviews: 200,
        lineage: 'master',
        taper: 'Betty Boards',
      });

      const score = scoreRecording(perfect, balancedWeights);
      expect(score).toBeGreaterThan(95);
    });

    it('scores a poor recording low', () => {
      const poor = createTestRecording({
        sourceType: 'aud',
        format: '128k MP3',
        avgRating: 2.0,
        numReviews: 5,
        lineage: 'm4',
        taper: null,
      });

      const score = scoreRecording(poor, balancedWeights);
      expect(score).toBeLessThan(50);
    });

    it('weights components correctly', () => {
      const recording = createTestRecording();
      const score = scoreRecording(recording, balancedWeights);

      // Should be weighted average of component scores
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('respects weight changes', () => {
      const recording = createTestRecording({
        sourceType: 'sbd',
        avgRating: 3.0,
      });

      // Balanced preset (sourceType: 0.35, rating: 0.20)
      const balancedScore = scoreRecording(recording, balancedWeights);

      // Crowd favorite preset (sourceType: 0.20, rating: 0.50)
      const crowdScore = scoreRecording(
        recording,
        SCORING_PRESETS.crowd_favorite.weights
      );

      // With lower rating and crowd_favorite weights,
      // score should be lower (rating weighted more heavily)
      expect(crowdScore).toBeLessThan(balancedScore);
    });
  });

  describe('scoreAndSortRecordings', () => {
    it('sorts recordings by score descending', () => {
      const recordings: RecordingQuality[] = [
        createTestRecording({
          identifier: 'poor',
          sourceType: 'aud',
          format: 'MP3',
        }),
        createTestRecording({
          identifier: 'excellent',
          sourceType: 'sbd',
          format: 'FLAC',
        }),
        createTestRecording({
          identifier: 'good',
          sourceType: 'matrix',
          format: 'VBR MP3',
        }),
      ];

      const sorted = scoreAndSortRecordings(recordings, balancedWeights);

      expect(sorted[0].identifier).toBe('excellent');
      expect(sorted[1].identifier).toBe('good');
      expect(sorted[2].identifier).toBe('poor');
    });

    it('includes scores in results', () => {
      const recordings = [createTestRecording()];
      const sorted = scoreAndSortRecordings(recordings, balancedWeights);

      expect(sorted[0]).toHaveProperty('score');
      expect(typeof sorted[0].score).toBe('number');
    });
  });

  describe('selectBestRecording', () => {
    it('returns the highest scoring recording', () => {
      const recordings: RecordingQuality[] = [
        createTestRecording({ identifier: 'rec1', sourceType: 'aud' }),
        createTestRecording({ identifier: 'rec2', sourceType: 'sbd' }),
        createTestRecording({ identifier: 'rec3', sourceType: 'matrix' }),
      ];

      const best = selectBestRecording(recordings, balancedWeights);

      expect(best).not.toBeNull();
      expect(best?.identifier).toBe('rec2'); // SBD is best
    });

    it('returns null for empty array', () => {
      const best = selectBestRecording([], balancedWeights);
      expect(best).toBeNull();
    });

    it('handles single recording', () => {
      const recordings = [createTestRecording({ identifier: 'only-one' })];
      const best = selectBestRecording(recordings, balancedWeights);

      expect(best?.identifier).toBe('only-one');
    });
  });

  describe('getScoreBreakdown', () => {
    it('provides detailed component scores', () => {
      const recording = createTestRecording();
      const breakdown = getScoreBreakdown(recording, balancedWeights);

      expect(breakdown).toHaveProperty('components');
      expect(breakdown).toHaveProperty('finalScore');

      expect(breakdown.components).toHaveProperty('sourceType');
      expect(breakdown.components).toHaveProperty('format');
      expect(breakdown.components).toHaveProperty('communityRating');
      expect(breakdown.components).toHaveProperty('lineage');
      expect(breakdown.components).toHaveProperty('taper');
    });

    it('includes raw, weighted, and weight for each component', () => {
      const recording = createTestRecording();
      const breakdown = getScoreBreakdown(recording, balancedWeights);

      const sourceComponent = breakdown.components.sourceType;
      expect(sourceComponent).toHaveProperty('raw');
      expect(sourceComponent).toHaveProperty('weighted');
      expect(sourceComponent).toHaveProperty('weight');

      expect(sourceComponent.weight).toBe(balancedWeights.sourceType);
    });

    it('calculates weighted scores correctly', () => {
      const recording = createTestRecording({ sourceType: 'sbd' });
      const breakdown = getScoreBreakdown(recording, balancedWeights);

      // SBD scores 100, weighted by 0.35 should be 35
      expect(breakdown.components.sourceType.raw).toBe(100);
      expect(breakdown.components.sourceType.weighted).toBe(35);
    });

    it('final score matches scoreRecording', () => {
      const recording = createTestRecording();
      const breakdown = getScoreBreakdown(recording, balancedWeights);
      const directScore = scoreRecording(recording, balancedWeights);

      expect(breakdown.finalScore).toBe(directScore);
    });
  });
});

describe('Scoring Engine - Real-World Scenarios', () => {
  const balancedWeights = SCORING_PRESETS.balanced.weights;

  it('prefers soundboard over audience recording', () => {
    const sbd: RecordingQuality = {
      identifier: 'sbd-recording',
      sourceType: 'sbd',
      format: 'MP3',
      avgRating: 4.0,
      numReviews: 50,
      taper: null,
      transferer: null,
      lineage: null,
    };

    const aud: RecordingQuality = {
      identifier: 'aud-recording',
      sourceType: 'aud',
      format: 'FLAC',
      avgRating: 4.5,
      numReviews: 100,
      taper: 'Charlie Miller',
      transferer: null,
      lineage: 'm1',
    };

    const recordings = [aud, sbd];
    const best = selectBestRecording(recordings, balancedWeights);

    // Even though aud has better format, rating, and taper,
    // SBD source type should win with balanced weights
    expect(best?.identifier).toBe('sbd-recording');
  });

  it('audiophile preset prioritizes technical quality', () => {
    const technicallyPerfect: RecordingQuality = {
      identifier: 'tech-perfect',
      sourceType: 'sbd',
      format: 'FLAC',
      avgRating: 3.0,
      numReviews: 10,
      taper: null,
      transferer: null,
      lineage: 'master',
    };

    const communityFavorite: RecordingQuality = {
      identifier: 'community-fav',
      sourceType: 'aud',
      format: 'MP3',
      avgRating: 5.0,
      numReviews: 200,
      taper: 'Popular Taper',
      transferer: null,
      lineage: 'm3',
    };

    const audiophileBest = selectBestRecording(
      [technicallyPerfect, communityFavorite],
      SCORING_PRESETS.audiophile.weights
    );

    const crowdBest = selectBestRecording(
      [technicallyPerfect, communityFavorite],
      SCORING_PRESETS.crowd_favorite.weights
    );

    expect(audiophileBest?.identifier).toBe('tech-perfect');
    expect(crowdBest?.identifier).toBe('community-fav');
  });

  it('handles Cornell 77 scenario (multiple excellent recordings)', () => {
    // Simulate famous Cornell '77 show with multiple versions
    const recordings: RecordingQuality[] = [
      {
        identifier: 'cornell-sbd-flac',
        sourceType: 'sbd',
        format: 'FLAC',
        avgRating: 4.9,
        numReviews: 500,
        taper: 'Betty Boards',
        transferer: 'Charlie Miller',
        lineage: 'master',
      },
      {
        identifier: 'cornell-aud-matrix',
        sourceType: 'matrix',
        format: 'FLAC',
        avgRating: 4.8,
        numReviews: 300,
        taper: 'Bertrando',
        transferer: null,
        lineage: 'm1',
      },
      {
        identifier: 'cornell-aud-low',
        sourceType: 'aud',
        format: '128k MP3',
        avgRating: 3.5,
        numReviews: 50,
        taper: null,
        transferer: null,
        lineage: 'm3',
      },
    ];

    const best = selectBestRecording(recordings, balancedWeights);

    // Betty Board SBD FLAC should win
    expect(best?.identifier).toBe('cornell-sbd-flac');
    expect(best?.score).toBeGreaterThan(90);
  });
});
