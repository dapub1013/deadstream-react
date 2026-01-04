import { db } from './database';
import type { Show } from '../types/show';

/**
 * Populates the database with Grateful Dead shows from archive.org
 * @param onProgress - Optional callback to report progress (0-100)
 */
export async function populateShowDatabase(
  onProgress?: (progress: number) => void
): Promise<void> {
  const BASE_URL = 'https://archive.org/advancedsearch.php';
  const BATCH_SIZE = 1000;

  let totalShows = 0;
  let processedShows = 0;

  try {
    // Step 1: Get total count first
    const countParams = new URLSearchParams({
      q: 'collection:GratefulDead AND mediatype:etree',
      fl: 'identifier',
      rows: '0',
      output: 'json'
    });

    const countResponse = await fetch(`${BASE_URL}?${countParams}`);
    if (!countResponse.ok) {
      throw new Error(`Failed to fetch show count: ${countResponse.statusText}`);
    }

    const countData = await countResponse.json();
    totalShows = countData.response.numFound;

    console.log(`[PopulateDB] Found ${totalShows} shows to import`);

    if (totalShows === 0) {
      throw new Error('No shows found in Internet Archive collection');
    }

    // Step 2: Fetch in batches
    for (let offset = 0; offset < totalShows; offset += BATCH_SIZE) {
      const params = new URLSearchParams({
        q: 'collection:GratefulDead AND mediatype:etree',
        fl: 'identifier,title,date,venue,coverage,avg_rating,num_reviews',
        rows: BATCH_SIZE.toString(),
        start: offset.toString(),
        sort: 'date asc',
        output: 'json'
      });

      const response = await fetch(`${BASE_URL}?${params}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch batch at offset ${offset}: ${response.statusText}`);
      }

      const data = await response.json();

      // Step 3: Transform and insert shows
      const shows: Omit<Show, 'id'>[] = data.response.docs.map((doc: any) => {
        // Parse location from coverage field (e.g., "San Francisco, CA")
        const location = parseLocation(doc.coverage || '');

        return {
          identifier: doc.identifier || '',
          date: doc.date || '',
          venue: doc.venue || 'Unknown Venue',
          city: location.city,
          state: location.state,
          avgRating: parseFloat(doc.avg_rating) || 0,
          numReviews: parseInt(doc.num_reviews) || 0,
          sourceType: inferSourceType(doc.identifier || ''),
          taper: null, // Will be lazy-loaded from metadata
          lastUpdated: new Date().toISOString()
        };
      });

      // Bulk insert shows
      await db.shows.bulkAdd(shows);

      processedShows += shows.length;

      // Report progress
      if (onProgress) {
        const progress = (processedShows / totalShows) * 100;
        onProgress(progress);
      }

      console.log(`[PopulateDB] Imported ${processedShows} / ${totalShows} shows`);
    }

    console.log('[PopulateDB] Database population complete');
  } catch (error) {
    console.error('[PopulateDB] Error populating database:', error);
    throw error;
  }
}

/**
 * Parse location string into city and state
 * @param coverage - Location string (e.g., "San Francisco, CA" or "Ithaca, NY, USA")
 */
function parseLocation(coverage: string): { city: string; state: string } {
  if (!coverage) {
    return { city: '', state: '' };
  }

  const parts = coverage.split(',').map(p => p.trim());

  if (parts.length >= 2) {
    // Format: "City, State" or "City, State, Country"
    return {
      city: parts[0],
      state: parts[1].substring(0, 2).toUpperCase() // Take first 2 chars for state code
    };
  }

  return { city: coverage, state: '' };
}

/**
 * Infer source type from identifier
 * @param identifier - Show identifier (e.g., "gd1977-05-08.sbd.miller.flac")
 */
function inferSourceType(identifier: string): 'sbd' | 'aud' | 'matrix' | null {
  const lower = identifier.toLowerCase();

  if (lower.includes('sbd') || lower.includes('soundboard')) {
    return 'sbd';
  }

  if (lower.includes('matrix')) {
    return 'matrix';
  }

  if (lower.includes('aud') || lower.includes('audience')) {
    return 'aud';
  }

  return null;
}
