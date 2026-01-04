/**
 * Tests for Recording Selector Service
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from './database';
import {
  extractRecordingQuality,
  compareRecordings,
} from './recordingSelector';
import { Show } from '../types/show';
import { RecordingQuality, ArchiveMetadataResponse } from '../types/metadata';
import { SCORING_PRESETS } from '../types/preferences';

describe('Recording Selector Service', () => {
  beforeEach(async () => {
    await db.shows.clear();
  });

  afterEach(async () => {
    await db.shows.clear();
  });

  describe('extractRecordingQuality', () => {
    it('extracts quality from show database info only', () => {
      const show: Show = {
        identifier: 'gd77-05-08.sbd.test',
        date: '1977-05-08',
        venue: 'Barton Hall, Cornell University',
        city: 'Ithaca',
        state: 'NY',
        avgRating: 4.8,
        numReviews: 500,
        sourceType: 'sbd',
        taper: 'Betty Boards',
        lastUpdated: new Date().toISOString(),
      };

      const quality = extractRecordingQuality(show);

      expect(quality.identifier).toBe('gd77-05-08.sbd.test');
      expect(quality.sourceType).toBe('sbd');
      expect(quality.avgRating).toBe(4.8);
      expect(quality.numReviews).toBe(500);
      expect(quality.taper).toBe('Betty Boards');
    });

    it('extracts source type from metadata', () => {
      const show: Show = {
        identifier: 'test-id',
        date: '1977-05-08',
        venue: 'Test Venue',
        city: 'Test',
        state: 'NY',
        avgRating: 4.0,
        numReviews: 100,
        sourceType: null,
        taper: null,
        lastUpdated: new Date().toISOString(),
      };

      const metadata: Partial<ArchiveMetadataResponse> = {
        metadata: {
          identifier: 'test-id',
          mediatype: 'etree',
          collection: 'GratefulDead',
          title: 'Grateful Dead - 1977-05-08',
          date: '1977-05-08',
          source: 'soundboard recording',
          taper: 'Charlie Miller',
        },
        files: [
          {
            name: 'test.flac',
            format: 'Flac',
            size: '50000000',
          },
        ],
      };

      const quality = extractRecordingQuality(
        show,
        metadata as ArchiveMetadataResponse
      );

      expect(quality.sourceType).toBe('sbd');
      expect(quality.taper).toBe('Charlie Miller');
      expect(quality.format).toBe('FLAC');
    });

    it('detects matrix from title', () => {
      const show: Show = {
        identifier: 'test-matrix',
        date: '1977-05-08',
        venue: 'Test',
        city: 'Test',
        state: 'NY',
        avgRating: 4.0,
        numReviews: 100,
        sourceType: null,
        taper: null,
        lastUpdated: new Date().toISOString(),
      };

      const metadata: Partial<ArchiveMetadataResponse> = {
        metadata: {
          identifier: 'test-matrix',
          mediatype: 'etree',
          collection: 'GratefulDead',
          title: 'Grateful Dead - Matrix Mix 1977-05-08',
          date: '1977-05-08',
        },
        files: [],
      };

      const quality = extractRecordingQuality(
        show,
        metadata as ArchiveMetadataResponse
      );

      expect(quality.sourceType).toBe('matrix');
    });

    it('prefers FLAC over MP3 when both available', () => {
      const show: Show = {
        identifier: 'test-multi-format',
        date: '1977-05-08',
        venue: 'Test',
        city: 'Test',
        state: 'NY',
        avgRating: 4.0,
        numReviews: 100,
        sourceType: 'sbd',
        taper: null,
        lastUpdated: new Date().toISOString(),
      };

      const metadata: Partial<ArchiveMetadataResponse> = {
        metadata: {
          identifier: 'test-multi-format',
          mediatype: 'etree',
          collection: 'GratefulDead',
          title: 'Test Show',
          date: '1977-05-08',
        },
        files: [
          { name: 'track1.mp3', format: 'VBR MP3' },
          { name: 'track1.flac', format: 'Flac' },
          { name: 'track2.mp3', format: 'VBR MP3' },
          { name: 'track2.flac', format: 'Flac' },
        ],
      };

      const quality = extractRecordingQuality(
        show,
        metadata as ArchiveMetadataResponse
      );

      expect(quality.format).toBe('FLAC');
    });
  });

  describe('compareRecordings', () => {
    it('compares two recordings and determines winner', () => {
      const sbd: RecordingQuality = {
        identifier: 'sbd-recording',
        sourceType: 'sbd',
        format: 'FLAC',
        avgRating: 4.5,
        numReviews: 100,
        taper: 'Betty Boards',
        transferer: null,
        lineage: 'master',
      };

      const aud: RecordingQuality = {
        identifier: 'aud-recording',
        sourceType: 'aud',
        format: 'MP3',
        avgRating: 4.0,
        numReviews: 50,
        taper: null,
        transferer: null,
        lineage: 'm2',
      };

      const comparison = compareRecordings(
        sbd,
        aud,
        SCORING_PRESETS.balanced.weights
      );

      expect(comparison.winner).toBe('recording1'); // SBD should win
      expect(comparison.recording1.finalScore).toBeGreaterThan(
        comparison.recording2.finalScore
      );
    });

    it('identifies a tie when scores are equal', () => {
      const rec1: RecordingQuality = {
        identifier: 'rec1',
        sourceType: 'sbd',
        format: 'MP3',
        avgRating: 4.0,
        numReviews: 100,
        taper: null,
        transferer: null,
        lineage: null,
      };

      const rec2: RecordingQuality = {
        identifier: 'rec2',
        sourceType: 'sbd',
        format: 'MP3',
        avgRating: 4.0,
        numReviews: 100,
        taper: null,
        transferer: null,
        lineage: null,
      };

      const comparison = compareRecordings(
        rec1,
        rec2,
        SCORING_PRESETS.balanced.weights
      );

      expect(comparison.winner).toBe('tie');
      expect(comparison.recording1.finalScore).toBe(
        comparison.recording2.finalScore
      );
    });

    it('provides detailed breakdown for each recording', () => {
      const rec1: RecordingQuality = {
        identifier: 'test1',
        sourceType: 'sbd',
        format: 'FLAC',
        avgRating: 4.5,
        numReviews: 200,
        taper: 'Charlie Miller',
        transferer: null,
        lineage: 'm1',
      };

      const rec2: RecordingQuality = {
        identifier: 'test2',
        sourceType: 'matrix',
        format: 'VBR MP3',
        avgRating: 4.7,
        numReviews: 300,
        taper: null,
        transferer: null,
        lineage: 'm2',
      };

      const comparison = compareRecordings(
        rec1,
        rec2,
        SCORING_PRESETS.balanced.weights
      );

      expect(comparison.recording1).toHaveProperty('components');
      expect(comparison.recording1).toHaveProperty('finalScore');
      expect(comparison.recording2).toHaveProperty('components');
      expect(comparison.recording2).toHaveProperty('finalScore');

      expect(comparison.recording1.components).toHaveProperty('sourceType');
      expect(comparison.recording1.components).toHaveProperty('format');
      expect(comparison.recording1.components).toHaveProperty('communityRating');
    });
  });

  describe('Cornell 77 Integration Test', () => {
    it('correctly scores famous Cornell 77 show with multiple recordings', () => {
      // Simulate the famous Cornell '77 show with three different recordings
      const sbdMaster: RecordingQuality = {
        identifier: 'gd77-05-08.sbd.hicks.4982.sbeok.shnf',
        sourceType: 'sbd',
        format: 'FLAC',
        avgRating: 4.9,
        numReviews: 500,
        taper: 'Betty Boards',
        transferer: 'Charlie Miller',
        lineage: 'master',
      };

      const matrixFLAC: RecordingQuality = {
        identifier: 'gd77-05-08.aud.bertrando.83937.flac16',
        sourceType: 'matrix',
        format: 'FLAC',
        avgRating: 4.8,
        numReviews: 300,
        taper: 'Bertrando',
        transferer: null,
        lineage: 'm1',
      };

      const audMP3: RecordingQuality = {
        identifier: 'gd77-05-08.aud.unknown.128mp3',
        sourceType: 'aud',
        format: '128k MP3',
        avgRating: 3.8,
        numReviews: 80,
        taper: null,
        transferer: null,
        lineage: 'm3',
      };

      // Compare SBD vs Matrix
      const sbdVsMatrix = compareRecordings(
        sbdMaster,
        matrixFLAC,
        SCORING_PRESETS.balanced.weights
      );

      expect(sbdVsMatrix.winner).toBe('recording1'); // SBD should win
      expect(sbdVsMatrix.recording1.finalScore).toBeGreaterThan(90);

      // Compare Matrix vs AUD
      const matrixVsAud = compareRecordings(
        matrixFLAC,
        audMP3,
        SCORING_PRESETS.balanced.weights
      );

      expect(matrixVsAud.winner).toBe('recording1'); // Matrix should win
      expect(matrixVsAud.recording1.finalScore).toBeGreaterThan(
        matrixVsAud.recording2.finalScore
      );

      // Compare SBD vs AUD (obvious winner)
      const sbdVsAud = compareRecordings(
        sbdMaster,
        audMP3,
        SCORING_PRESETS.balanced.weights
      );

      expect(sbdVsAud.winner).toBe('recording1'); // SBD should dominate
      const scoreDiff =
        sbdVsAud.recording1.finalScore - sbdVsAud.recording2.finalScore;
      expect(scoreDiff).toBeGreaterThan(20); // Significant difference
    });

    it('uses different presets to get different results', () => {
      const technicallyPerfect: RecordingQuality = {
        identifier: 'tech-perfect',
        sourceType: 'sbd',
        format: 'FLAC',
        avgRating: 3.5, // Lower rating
        numReviews: 20, // Few reviews
        taper: null,
        transferer: null,
        lineage: 'master',
      };

      const crowdFavorite: RecordingQuality = {
        identifier: 'crowd-fav',
        sourceType: 'aud',
        format: 'VBR MP3',
        avgRating: 4.9, // Excellent rating
        numReviews: 500, // Many reviews
        taper: 'Popular Taper',
        transferer: null,
        lineage: 'm2',
      };

      // With balanced preset
      const balancedComparison = compareRecordings(
        technicallyPerfect,
        crowdFavorite,
        SCORING_PRESETS.balanced.weights
      );

      // With audiophile preset (prioritizes technical quality)
      const audiophileComparison = compareRecordings(
        technicallyPerfect,
        crowdFavorite,
        SCORING_PRESETS.audiophile.weights
      );

      // With crowd_favorite preset (prioritizes ratings)
      const crowdComparison = compareRecordings(
        technicallyPerfect,
        crowdFavorite,
        SCORING_PRESETS.crowd_favorite.weights
      );

      // Audiophile preset should favor the technically perfect recording
      expect(audiophileComparison.winner).toBe('recording1');

      // Crowd favorite preset should favor the highly rated recording
      expect(crowdComparison.winner).toBe('recording2');
    });
  });
});
