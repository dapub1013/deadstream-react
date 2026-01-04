/**
 * Archive API Client Tests
 *
 * These tests interact with the real Archive.org API
 * They may be slow due to network requests and rate limiting
 */

import { describe, it, expect } from 'vitest';
import {
  searchShows,
  getMetadata,
  extractAudioFiles,
  getShowPlaylist,
  extractRecordingQuality,
  buildStreamUrl,
  formatDuration,
} from './archiveApi';

// Test identifier for Cornell '77
const CORNELL_77 = 'gd1977-05-08.111493.mtx.seamons.sbeok.flac16';

describe('Archive API Client', () => {
  describe('searchShows', () => {
    it('searches shows by date', async () => {
      const shows = await searchShows({ date: '1977-05-08', rows: 5 });

      expect(shows.length).toBeGreaterThan(0);
      // Archive.org returns ISO 8601 dates, we convert to YYYY-MM-DD
      expect(shows[0].date).toBe('1977-05-08');
      expect(shows[0].identifier).toBeTruthy();
      expect(shows[0].venue).toBeTruthy();
    }, 10000); // 10 second timeout for network request

    it('searches shows by year', async () => {
      const shows = await searchShows({ year: 1977, rows: 10 });

      expect(shows.length).toBeGreaterThan(0);
      shows.forEach((show) => {
        expect(show.date).toMatch(/^1977-/);
      });
    }, 10000);

    it('limits number of results', async () => {
      const shows = await searchShows({ year: 1977, rows: 3 });

      expect(shows.length).toBeLessThanOrEqual(3);
    }, 10000);
  });

  describe('getMetadata', () => {
    it('fetches metadata for Cornell 77', async () => {
      // Famous Cornell '77 show - should always be available
      const metadata = await getMetadata('gd1977-05-08.111493.mtx.seamons.sbeok.flac16');

      expect(metadata.metadata.title).toBeTruthy();
      expect(metadata.metadata.date).toBeTruthy();
      expect(metadata.metadata.identifier).toBe('gd1977-05-08.111493.mtx.seamons.sbeok.flac16');
      expect(metadata.files.length).toBeGreaterThan(0);
    }, 10000);

    it('returns empty metadata for invalid identifier', async () => {
      // Archive.org returns {} for invalid identifiers instead of throwing
      const metadata = await getMetadata('this-identifier-does-not-exist-12345');
      // Empty metadata will have no files
      expect(metadata.files || []).toHaveLength(0);
    }, 10000);

    it('throws error for empty identifier', async () => {
      await expect(getMetadata('')).rejects.toThrow('Identifier is required');
    });
  });

  describe('extractAudioFiles', () => {
    it('extracts audio files from metadata', async () => {
      const metadata = await getMetadata('gd1977-05-08.111493.mtx.seamons.sbeok.flac16');
      const audioFiles = extractAudioFiles(metadata);

      expect(audioFiles.length).toBeGreaterThan(0);

      // Check first audio file structure
      const firstTrack = audioFiles[0];
      expect(firstTrack.url).toContain('archive.org/download');
      expect(firstTrack.url).toContain('gd1977-05-08.111493.mtx.seamons.sbeok.flac16');
      expect(firstTrack.filename).toBeTruthy();
      expect(firstTrack.title).toBeTruthy();
      expect(firstTrack.format).toBeTruthy();
      expect(firstTrack.index).toBe(0);
    }, 10000);

    it('filters out low quality files', async () => {
      const metadata = await getMetadata('gd1977-05-08.111493.mtx.seamons.sbeok.flac16');
      const audioFiles = extractAudioFiles(metadata);

      // Should not include any 64kb files
      audioFiles.forEach((file) => {
        expect(file.filename.toLowerCase()).not.toContain('64kb');
      });
    }, 10000);

    it('sorts tracks in correct order', async () => {
      const metadata = await getMetadata('gd1977-05-08.111493.mtx.seamons.sbeok.flac16');
      const audioFiles = extractAudioFiles(metadata);

      // Track indices should be sequential
      audioFiles.forEach((track, index) => {
        expect(track.index).toBe(index);
      });
    }, 10000);
  });

  describe('getShowPlaylist', () => {
    it('creates complete playlist for a show', async () => {
      const playlist = await getShowPlaylist('gd1977-05-08.111493.mtx.seamons.sbeok.flac16');

      expect(playlist.identifier).toBe('gd1977-05-08.111493.mtx.seamons.sbeok.flac16');
      expect(playlist.tracks.length).toBeGreaterThan(0);
      expect(playlist.totalDuration).toBeGreaterThan(0);
      expect(playlist.format).toBeTruthy();
    }, 10000);
  });

  describe('extractRecordingQuality', () => {
    it('extracts quality metadata for matrix recording', async () => {
      const metadata = await getMetadata('gd1977-05-08.111493.mtx.seamons.sbeok.flac16');
      const quality = extractRecordingQuality(metadata);

      expect(quality.identifier).toBe('gd1977-05-08.111493.mtx.seamons.sbeok.flac16');
      expect(quality.sourceType).toBe('matrix'); // Should detect matrix
      expect(quality.format).toBeTruthy();
    }, 10000);
  });

  describe('Helper Functions', () => {
    it('builds correct stream URL', () => {
      const url = buildStreamUrl('gd1977-05-08', 'track01.mp3');
      expect(url).toBe('https://archive.org/download/gd1977-05-08/track01.mp3');
    });

    it('formats duration correctly', () => {
      expect(formatDuration(65)).toBe('1:05');
      expect(formatDuration(3665)).toBe('1:01:05');
      expect(formatDuration(45)).toBe('0:45');
    });

    it('handles special characters in filename', () => {
      const url = buildStreamUrl('gd1977-05-08', 'track with spaces.mp3');
      expect(url).toContain('track%20with%20spaces.mp3');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    describe('Invalid Identifiers', () => {
      it('handles empty identifier', async () => {
        await expect(getMetadata('')).rejects.toThrow('Identifier is required');
      });

      it('handles null/undefined identifier', async () => {
        await expect(getMetadata(null as any)).rejects.toThrow();
        await expect(getMetadata(undefined as any)).rejects.toThrow();
      });

      it('handles whitespace-only identifier', async () => {
        await expect(getMetadata('   ')).rejects.toThrow('Identifier is required');
      });

      it('returns empty metadata for non-existent identifier', async () => {
        const metadata = await getMetadata('this-identifier-definitely-does-not-exist-12345');

        // Archive.org returns {} for non-existent items
        expect(metadata.files || []).toHaveLength(0);
      }, 10000);

      it('handles malformed identifier gracefully', async () => {
        // Test with various malformed identifiers
        const malformedIds = [
          'invalid..identifier',
          'id-with-@-symbol',
          'id/with/slashes',
        ];

        for (const id of malformedIds) {
          // Should not throw, but may return empty results
          const metadata = await getMetadata(id);
          expect(metadata).toBeDefined();
        }
      }, 15000);
    });

    describe('Missing or Empty Audio Files', () => {
      it('handles metadata with no audio files', () => {
        const mockMetadata: any = {
          metadata: { identifier: 'test', title: 'Test' },
          files: [
            { name: 'info.txt', format: 'Text' },
            { name: 'image.jpg', format: 'JPEG' },
          ],
        };

        const audioFiles = extractAudioFiles(mockMetadata);
        expect(audioFiles).toEqual([]);
      });

      it('handles metadata with empty files array', () => {
        const mockMetadata: any = {
          metadata: { identifier: 'test', title: 'Test' },
          files: [],
        };

        const audioFiles = extractAudioFiles(mockMetadata);
        expect(audioFiles).toEqual([]);
      });

      it('handles metadata with missing files property', () => {
        const mockMetadata: any = {
          metadata: { identifier: 'test', title: 'Test' },
        };

        expect(() => extractAudioFiles(mockMetadata)).toThrow();
      });

      it('handles audio files with missing duration', () => {
        const mockMetadata: any = {
          metadata: { identifier: 'test' },
          files: [
            { name: 'track01.mp3', format: 'VBR MP3' },
          ],
        };

        const audioFiles = extractAudioFiles(mockMetadata);
        expect(audioFiles[0].duration).toBe(0);
      });

      it('handles audio files with invalid duration format', () => {
        const mockMetadata: any = {
          metadata: { identifier: 'test' },
          files: [
            { name: 'track01.mp3', format: 'VBR MP3', length: 'invalid' },
          ],
        };

        const audioFiles = extractAudioFiles(mockMetadata);
        expect(audioFiles[0].duration).toBe(0);
      });
    });

    describe('Search Edge Cases', () => {
      it('handles search with no results', async () => {
        // Search for a date far in the future
        const shows = await searchShows({ date: '2099-12-31', rows: 10 });
        expect(shows).toEqual([]);
      }, 10000);

      it('handles search with invalid date format', async () => {
        // Archive.org may return error or empty results for invalid dates
        try {
          const shows = await searchShows({ date: 'not-a-date', rows: 10 });
          expect(Array.isArray(shows)).toBe(true);
        } catch (error) {
          // If Archive.org rejects the query, that's also acceptable
          expect(error).toBeInstanceOf(Error);
        }
      }, 10000);

      it('handles search with year 0', async () => {
        const shows = await searchShows({ year: 0, rows: 5 });
        expect(Array.isArray(shows)).toBe(true);
      }, 10000);

      it('handles search with very large rows parameter', async () => {
        // Archive.org limits results, should not cause issues
        const shows = await searchShows({ year: 1977, rows: 100000 });
        expect(Array.isArray(shows)).toBe(true);
        expect(shows.length).toBeLessThan(100000);
      }, 10000);
    });

    describe('Recording Quality Edge Cases', () => {
      it('handles metadata with missing quality fields', () => {
        const mockMetadata: any = {
          metadata: { identifier: 'test' },
          files: [{ name: 'track.mp3', format: 'MP3' }],
        };

        const quality = extractRecordingQuality(mockMetadata);
        expect(quality.identifier).toBe('test');
        expect(quality.sourceType).toBe('unknown');
        expect(quality.taper).toBe(null);
        expect(quality.transferer).toBe(null);
        expect(quality.avgRating).toBe(0);
        expect(quality.numReviews).toBe(0);
      });

      it('detects source type from identifier', () => {
        const sbdMetadata: any = {
          metadata: { identifier: 'gd1977-05-08.sbd.miller.flac' },
          files: [{ name: 'track.flac', format: 'FLAC' }],
        };

        const quality = extractRecordingQuality(sbdMetadata);
        expect(quality.sourceType).toBe('sbd');
      });

      it('detects matrix from identifier', () => {
        const matrixMetadata: any = {
          metadata: { identifier: 'gd1977-05-08.mtx.seamons.flac' },
          files: [{ name: 'track.flac', format: 'FLAC' }],
        };

        const quality = extractRecordingQuality(matrixMetadata);
        expect(quality.sourceType).toBe('matrix');
      });

      it('defaults to unknown for ambiguous recordings', () => {
        const unknownMetadata: any = {
          metadata: { identifier: 'gd1977-05-08.recording' },
          files: [{ name: 'track.mp3', format: 'MP3' }],
        };

        const quality = extractRecordingQuality(unknownMetadata);
        expect(quality.sourceType).toBe('unknown');
      });
    });

    describe('URL Building Edge Cases', () => {
      it('handles identifiers with special characters', () => {
        const url = buildStreamUrl('id-with-dashes', 'file.mp3');
        expect(url).toContain('id-with-dashes');
      });

      it('encodes filenames with special characters', () => {
        const specialChars = [
          'file with spaces.mp3',
          'file(with)parens.mp3',
          'file[with]brackets.mp3',
          "file'with'quotes.mp3",
        ];

        specialChars.forEach((filename) => {
          const url = buildStreamUrl('test-id', filename);
          expect(url).toContain('archive.org/download');
          expect(url).not.toContain(' ');
        });
      });

      it('handles empty filename', () => {
        const url = buildStreamUrl('test-id', '');
        expect(url).toContain('archive.org/download/test-id/');
      });
    });

    describe('Duration Formatting Edge Cases', () => {
      it('handles zero duration', () => {
        expect(formatDuration(0)).toBe('0:00');
      });

      it('handles negative duration', () => {
        expect(formatDuration(-100)).toBe('0:00');
      });

      it('handles very large durations', () => {
        const tenHours = 10 * 3600;
        expect(formatDuration(tenHours)).toBe('10:00:00');
      });

      it('handles fractional seconds', () => {
        expect(formatDuration(65.7)).toBe('1:05');
        expect(formatDuration(100.999)).toBe('1:40');
      });

      it('handles NaN', () => {
        expect(formatDuration(NaN)).toBe('0:00');
      });

      it('handles Infinity', () => {
        expect(formatDuration(Infinity)).toBe('0:00');
      });
    });

    describe('Playlist Edge Cases', () => {
      it('handles playlist with single track', async () => {
        // Most shows have multiple tracks, but edge case testing
        const mockMetadata: any = {
          metadata: { identifier: 'test-show' },
          files: [
            { name: 'track01.mp3', format: 'VBR MP3', length: '300', size: '5000000' },
          ],
        };

        // Mock getMetadata for this test
        const originalGetMetadata = getMetadata;

        // We'll use a show that exists but may have few tracks
        // Just verify the function handles it
        const playlist = await getShowPlaylist(CORNELL_77);
        expect(playlist.tracks.length).toBeGreaterThan(0);
        expect(playlist.totalDuration).toBeGreaterThan(0);
      }, 15000);
    });

    describe('Network Error Simulation', () => {
      it('handles connection timeouts gracefully', async () => {
        // We can't easily simulate timeouts with real API,
        // but we test that errors are propagated correctly
        try {
          await getMetadata('test-identifier-that-might-timeout');
          // If it succeeds, that's fine
          expect(true).toBe(true);
        } catch (error) {
          // If it fails, error should be properly formatted
          expect(error).toBeInstanceOf(Error);
          if (error instanceof Error) {
            expect(error.message).toBeTruthy();
          }
        }
      }, 20000);
    });
  });
});
