/**
 * TypeScript interfaces for Archive.org API responses
 *
 * The Internet Archive returns JSON metadata for each show identifier.
 * These types define the structure of that response data.
 */

/**
 * Main metadata response structure from Archive.org
 * GET https://archive.org/metadata/{identifier}
 */
export interface ArchiveMetadataResponse {
  created: number;
  d1: string;
  d2: string;
  dir: string;
  files: ArchiveFile[];
  files_count: number;
  item_last_updated: number;
  item_size: number;
  metadata: ArchiveMetadata;
  server: string;
  uniq: number;
  workable_servers: string[];
}

/**
 * Show metadata (title, date, venue, source information, etc.)
 * Found in metadata.metadata field of the API response
 */
export interface ArchiveMetadata {
  identifier: string;
  mediatype: string;
  collection: string | string[];
  title: string;
  date: string;
  year?: string;
  venue?: string;
  coverage?: string;        // Location in "City, State" format
  source?: string;          // Recording source type (sbd, aud, matrix)
  taper?: string;
  transferer?: string;
  lineage?: string;
  description?: string | string[];
  notes?: string;
  subject?: string | string[];
  uploader?: string;
  publicdate?: string;
  addeddate?: string;
  avg_rating?: string;      // String representation of decimal
  num_reviews?: string;     // String representation of integer
  creator?: string;
  // Archive.org metadata can have many optional fields
  [key: string]: any;
}

/**
 * Individual file information from Archive.org
 * Found in files array of the API response
 */
export interface ArchiveFile {
  name: string;             // Filename (e.g., "gd77-05-08d1t01.mp3")
  source?: string;          // Original or derivative
  format: string;           // File format (e.g., "VBR MP3", "Flac", "Ogg Vorbis")
  original?: string;        // Original filename if derivative
  mtime?: string;           // Modification time
  size?: string;            // File size in bytes (as string)
  md5?: string;             // MD5 checksum
  crc32?: string;           // CRC32 checksum
  sha1?: string;            // SHA1 checksum
  length?: string;          // Duration in seconds (as string, e.g., "365.12")
  height?: string;          // Video height (for video files)
  width?: string;           // Video width (for video files)
  title?: string;           // Track title
  track?: string;           // Track number
  album?: string;           // Album name
  artist?: string;          // Artist name
  genre?: string;           // Music genre
  // Archive.org files can have many optional fields
  [key: string]: any;
}

/**
 * Processed audio track for playback
 * This is our internal representation after extracting from ArchiveFile
 */
export interface AudioTrack {
  url: string;              // Full streaming URL
  filename: string;         // Original filename
  title: string;            // Display title (cleaned up)
  duration: number;         // Duration in seconds (parsed from string)
  format: string;           // Audio format (VBR MP3, Flac, etc.)
  size: number;             // File size in bytes
  index: number;            // Track number in playlist (0-based)
  trackNumber?: string;     // Original track number from metadata
}

/**
 * Search response from Archive.org advanced search
 * GET https://archive.org/advancedsearch.php
 */
export interface ArchiveSearchResponse {
  responseHeader: {
    status: number;
    QTime: number;
    params: {
      query: string;
      qin: string;
      fields: string;
      wt: string;
      rows: string;
      start: string;
    };
  };
  response: {
    numFound: number;
    start: number;
    docs: ArchiveSearchResult[];
  };
}

/**
 * Individual search result from Archive.org
 * Structure varies based on requested fields (fl parameter)
 */
export interface ArchiveSearchResult {
  identifier: string;
  title?: string;
  date?: string;
  venue?: string;
  coverage?: string;
  collection?: string[];
  mediatype?: string;
  avg_rating?: number;
  num_reviews?: number;
  downloads?: number;
  item_size?: number;
  publicdate?: string;
  addeddate?: string;
  // Search results can include any requested field
  [key: string]: any;
}

/**
 * Playlist information for a show
 * Contains all tracks ready for playback
 */
export interface ShowPlaylist {
  identifier: string;       // Archive.org identifier
  tracks: AudioTrack[];     // All audio tracks in order
  totalDuration: number;    // Total duration in seconds
  format: string;           // Primary audio format
}

/**
 * Recording quality metadata
 * Used for scoring and selection algorithm
 */
export interface RecordingQuality {
  identifier: string;
  sourceType: 'sbd' | 'aud' | 'matrix' | 'unknown';
  taper: string | null;
  transferer: string | null;
  lineage: string | null;
  avgRating: number;
  numReviews: number;
  format: string;           // Audio format (affects quality)
  score?: number;           // Computed quality score
}
