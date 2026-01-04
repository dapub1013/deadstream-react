/**
 * Archive.org API Client
 *
 * Handles all interactions with the Internet Archive API:
 * - Search for Grateful Dead shows
 * - Fetch metadata for specific shows
 * - Extract audio files for playback
 * - Rate limiting to be respectful of Archive.org servers
 */

import {
  ArchiveMetadataResponse,
  ArchiveSearchResponse,
  ArchiveSearchResult,
  ArchiveFile,
  AudioTrack,
  ShowPlaylist,
  RecordingQuality,
} from '../types/metadata';
import { Show } from '../types/show';

// API Configuration
const BASE_URL = 'https://archive.org';
const MIN_REQUEST_INTERVAL = 1000; // 1 second between requests (respectful rate limiting)
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

// Audio formats in order of preference
const AUDIO_FORMATS = ['VBR MP3', 'MP3', 'Ogg Vorbis', 'Flac', 'FLAC'];

/**
 * Rate Limiter Class
 * Ensures we don't overwhelm Archive.org servers with requests
 */
class RateLimiter {
  private lastRequest = 0;

  /**
   * Throttle a function to respect rate limits
   * Waits if needed before executing
   */
  async throttle<T>(fn: () => Promise<T>): Promise<T> {
    const now = Date.now();
    const elapsed = now - this.lastRequest;
    const wait = Math.max(0, MIN_REQUEST_INTERVAL - elapsed);

    if (wait > 0) {
      await new Promise((resolve) => setTimeout(resolve, wait));
    }

    this.lastRequest = Date.now();
    return fn();
  }
}

// Singleton rate limiter instance
const limiter = new RateLimiter();

/**
 * Custom error class for API errors
 */
export class ArchiveApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public identifier?: string
  ) {
    super(message);
    this.name = 'ArchiveApiError';
  }
}

/**
 * Make an HTTP request with retry logic
 */
async function fetchWithRetry(
  url: string,
  retries = MAX_RETRIES
): Promise<Response> {
  let lastError: Error | null = null;

  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);

      if (response.ok) {
        return response;
      }

      // Don't retry on 404 (not found)
      if (response.status === 404) {
        throw new ArchiveApiError(
          `Resource not found: ${url}`,
          response.status
        );
      }

      // Retry on other errors
      lastError = new ArchiveApiError(
        `HTTP ${response.status}: ${response.statusText}`,
        response.status
      );
    } catch (error) {
      lastError = error as Error;
    }

    // Wait before retrying
    if (i < retries - 1) {
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
    }
  }

  throw lastError || new ArchiveApiError('Request failed after retries');
}

/**
 * Search Parameters Interface
 */
export interface SearchParams {
  date?: string; // YYYY-MM-DD format
  year?: number; // Just the year
  venue?: string; // Venue name (partial match)
  query?: string; // Custom query string
  rows?: number; // Number of results (default 100)
  sort?: 'date' | 'rating' | 'downloads'; // Sort order
}

/**
 * Search for Grateful Dead shows
 *
 * @param params Search parameters
 * @returns Array of show data
 */
export async function searchShows(params: SearchParams = {}): Promise<Show[]> {
  const query = buildSearchQuery(params);
  const sortField = getSortField(params.sort || 'date');

  const searchParams = new URLSearchParams({
    q: query,
    fl: 'identifier,title,date,venue,coverage,avg_rating,num_reviews,downloads',
    rows: (params.rows || 100).toString(),
    sort: sortField,
    output: 'json',
  });

  const url = `${BASE_URL}/advancedsearch.php?${searchParams}`;

  return limiter.throttle(async () => {
    const response = await fetchWithRetry(url);
    const data: ArchiveSearchResponse = await response.json();

    return data.response.docs.map(transformSearchResult);
  });
}

/**
 * Get full metadata for a specific show
 *
 * @param identifier Archive.org identifier
 * @returns Full metadata response
 */
export async function getMetadata(
  identifier: string
): Promise<ArchiveMetadataResponse> {
  if (!identifier || identifier.trim() === '') {
    throw new ArchiveApiError('Identifier is required', undefined, identifier);
  }

  const url = `${BASE_URL}/metadata/${identifier}`;

  return limiter.throttle(async () => {
    const response = await fetchWithRetry(url);
    return response.json();
  });
}

/**
 * Extract audio files from metadata response
 *
 * @param metadata Full metadata response
 * @returns Array of audio tracks ready for playback
 */
export function extractAudioFiles(
  metadata: ArchiveMetadataResponse
): AudioTrack[] {
  const audioFiles = metadata.files
    .filter(isAudioFile)
    .filter((file) => !isLowQuality(file))
    .sort((a, b) => compareFilenames(a.name, b.name));

  return audioFiles.map((file, index) => ({
    url: buildStreamUrl(metadata.metadata.identifier, file.name),
    filename: file.name,
    title: extractTrackTitle(file),
    duration: parseDuration(file.length),
    format: file.format,
    size: parseInt(file.size || '0', 10),
    index,
    trackNumber: file.track,
  }));
}

/**
 * Get a complete playlist for a show
 *
 * @param identifier Archive.org identifier
 * @returns Show playlist with all tracks
 */
export async function getShowPlaylist(
  identifier: string
): Promise<ShowPlaylist> {
  const metadata = await getMetadata(identifier);
  const tracks = extractAudioFiles(metadata);

  const totalDuration = tracks.reduce(
    (sum, track) => sum + track.duration,
    0
  );

  // Determine primary format (most common in tracks)
  const formatCounts = tracks.reduce((acc, track) => {
    acc[track.format] = (acc[track.format] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const format =
    Object.entries(formatCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'MP3';

  return {
    identifier,
    tracks,
    totalDuration,
    format,
  };
}

/**
 * Extract recording quality information from metadata
 *
 * @param metadata Full metadata response
 * @returns Recording quality data
 */
export function extractRecordingQuality(
  metadata: ArchiveMetadataResponse
): RecordingQuality {
  const meta = metadata.metadata;
  const audioFiles = metadata.files.filter(isAudioFile);
  const primaryFormat = audioFiles[0]?.format || 'Unknown';

  return {
    identifier: meta.identifier,
    sourceType: inferSourceType(meta),
    taper: meta.taper || null,
    transferer: meta.transferer || null,
    lineage: meta.lineage || null,
    avgRating: parseFloat(meta.avg_rating || '0'),
    numReviews: parseInt(meta.num_reviews || '0', 10),
    format: primaryFormat,
  };
}

/**
 * Build stream URL for a specific file
 *
 * @param identifier Archive.org identifier
 * @param filename File name
 * @returns Full streaming URL
 */
export function buildStreamUrl(identifier: string, filename: string): string {
  return `${BASE_URL}/download/${identifier}/${encodeURIComponent(filename)}`;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Build search query from parameters
 */
function buildSearchQuery(params: SearchParams): string {
  const parts: string[] = ['collection:GratefulDead', 'mediatype:etree'];

  if (params.date) {
    parts.push(`date:${params.date}`);
  } else if (params.year) {
    // Use date range for year searches (Archive.org doesn't support wildcards)
    parts.push(`date:[${params.year}-01-01 TO ${params.year}-12-31]`);
  }

  if (params.venue) {
    parts.push(`venue:${params.venue}`);
  }

  if (params.query) {
    parts.push(params.query);
  }

  return parts.join(' AND ');
}

/**
 * Get sort field for search
 */
function getSortField(sort: string): string {
  switch (sort) {
    case 'rating':
      return 'avg_rating desc';
    case 'downloads':
      return 'downloads desc';
    case 'date':
    default:
      return 'date asc';
  }
}

/**
 * Transform search result to Show interface
 */
function transformSearchResult(doc: ArchiveSearchResult): Show {
  // Parse location from coverage field (format: "City, State")
  const { city, state } = parseLocation(doc.coverage);

  // Archive.org returns dates in ISO 8601 format (YYYY-MM-DDTHH:MM:SSZ)
  // Extract just the date part
  const date = doc.date ? doc.date.split('T')[0] : '';

  return {
    identifier: doc.identifier,
    date,
    venue: doc.venue || 'Unknown Venue',
    city,
    state,
    avgRating: doc.avg_rating || 0,
    numReviews: doc.num_reviews || 0,
    sourceType: null, // Lazy loaded later
    taper: null, // Lazy loaded later
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Parse location string into city and state
 */
function parseLocation(coverage?: string): { city: string; state: string } {
  if (!coverage) {
    return { city: '', state: '' };
  }

  // Format is typically "City, State" or "City, ST"
  const parts = coverage.split(',').map((s) => s.trim());

  if (parts.length >= 2) {
    return {
      city: parts[0],
      state: parts[1].substring(0, 2).toUpperCase(), // Take first 2 chars for state code
    };
  }

  return { city: coverage, state: '' };
}

/**
 * Check if file is an audio file we can play
 */
function isAudioFile(file: ArchiveFile): boolean {
  return AUDIO_FORMATS.includes(file.format);
}

/**
 * Check if file is low quality (skip 64kb files)
 */
function isLowQuality(file: ArchiveFile): boolean {
  const filename = file.name.toLowerCase();
  return filename.includes('64kb') || filename.includes('_64kb');
}

/**
 * Compare filenames for sorting
 * Ensures correct track order (d1t01, d1t02, d2t01, etc.)
 */
function compareFilenames(a: string, b: string): number {
  // Extract disc and track numbers using regex
  const parseTrack = (name: string) => {
    const match = name.match(/d?(\d+)t(\d+)/i);
    if (match) {
      return {
        disc: parseInt(match[1] || '1', 10),
        track: parseInt(match[2] || '0', 10),
      };
    }
    return { disc: 1, track: 0 };
  };

  const aTrack = parseTrack(a);
  const bTrack = parseTrack(b);

  if (aTrack.disc !== bTrack.disc) {
    return aTrack.disc - bTrack.disc;
  }

  if (aTrack.track !== bTrack.track) {
    return aTrack.track - bTrack.track;
  }

  // Fall back to alphabetical
  return a.localeCompare(b);
}

/**
 * Extract track title from file metadata or filename
 */
function extractTrackTitle(file: ArchiveFile): string {
  // Prefer metadata title if available
  if (file.title && file.title.trim() !== '') {
    return file.title.trim();
  }

  // Fall back to parsing filename
  let title = file.name;

  // Remove file extension
  title = title.replace(/\.(mp3|flac|ogg)$/i, '');

  // Remove common prefixes (e.g., "01t01", "d1t01", "gd77-05-08d1t01")
  title = title.replace(/^.*?(d\d+)?t?\d+[-_\s]*/i, '');

  // Replace underscores and dashes with spaces
  title = title.replace(/[_-]/g, ' ');

  // Clean up multiple spaces
  title = title.replace(/\s+/g, ' ').trim();

  return title || 'Unknown Track';
}

/**
 * Parse duration string to seconds
 */
function parseDuration(lengthStr?: string): number {
  if (!lengthStr) return 0;

  // Handle decimal seconds (e.g., "365.12")
  const asFloat = parseFloat(lengthStr);
  if (!isNaN(asFloat)) {
    return Math.floor(asFloat);
  }

  // Handle MM:SS or HH:MM:SS format
  const parts = lengthStr.split(':').map(Number);

  if (parts.length === 2) {
    // MM:SS
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 3) {
    // HH:MM:SS
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }

  return 0;
}

/**
 * Infer source type from metadata
 */
function inferSourceType(
  metadata: ArchiveMetadata
): 'sbd' | 'aud' | 'matrix' | 'unknown' {
  const source = (metadata.source || '').toLowerCase();
  const title = (metadata.title || '').toLowerCase();
  const identifier = (metadata.identifier || '').toLowerCase();

  // Check all fields for source type indicators
  const combined = `${source} ${title} ${identifier}`;

  if (
    combined.includes('sbd') ||
    combined.includes('soundboard') ||
    combined.includes('sound board')
  ) {
    return 'sbd';
  }

  if (combined.includes('matrix') || combined.includes('mtx')) {
    return 'matrix';
  }

  if (
    combined.includes('aud') ||
    combined.includes('audience') ||
    combined.includes('fob') || // Front of board
    combined.includes('dfc') // Dance floor center
  ) {
    return 'aud';
  }

  return 'unknown';
}

/**
 * Format duration in seconds to MM:SS or HH:MM:SS
 * Handles edge cases: NaN, Infinity, negative numbers
 */
export function formatDuration(seconds: number): string {
  // Handle edge cases
  if (!isFinite(seconds) || isNaN(seconds) || seconds < 0) {
    return '0:00';
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  }

  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Get total count of shows in collection (for progress indicators)
 */
export async function getShowCount(): Promise<number> {
  const searchParams = new URLSearchParams({
    q: 'collection:GratefulDead AND mediatype:etree',
    rows: '0',
    output: 'json',
  });

  const url = `${BASE_URL}/advancedsearch.php?${searchParams}`;

  return limiter.throttle(async () => {
    const response = await fetchWithRetry(url);
    const data: ArchiveSearchResponse = await response.json();
    return data.response.numFound;
  });
}
