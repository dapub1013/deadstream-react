import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  db,
  addShow,
  getShowByIdentifier,
  getShowsByDate,
  getShowsByYear,
  getTopRatedShows,
  getShowCount,
  searchByVenue,
  clearAllShows
} from './database';
import type { Show } from '../types/show';

describe('Database', () => {
  beforeEach(async () => {
    await db.shows.clear();
  });

  afterEach(async () => {
    await db.shows.clear();
  });

  it('adds a show to database', async () => {
    const show: Omit<Show, 'id'> = {
      identifier: 'gd1977-05-08.sbd',
      date: '1977-05-08',
      venue: 'Barton Hall, Cornell University',
      city: 'Ithaca',
      state: 'NY',
      avgRating: 4.8,
      numReviews: 500,
      sourceType: 'sbd',
      taper: 'Betty Boards',
      lastUpdated: new Date().toISOString()
    };
    
    const id = await addShow(show);
    expect(id).toBeGreaterThan(0);
    
    const retrieved = await db.shows.get(id);
    expect(retrieved).toBeDefined();
    expect(retrieved?.venue).toBe('Barton Hall, Cornell University');
  });

  it('retrieves shows by identifier', async () => {
    await addShow({
      identifier: 'unique-id-123',
      date: '1977-05-08',
      venue: 'Test Venue',
      city: 'Test City',
      state: 'NY',
      avgRating: 4.0,
      numReviews: 10,
      sourceType: null,
      taper: null,
      lastUpdated: new Date().toISOString()
    });
    
    const show = await getShowByIdentifier('unique-id-123');
    expect(show).toBeDefined();
    expect(show?.identifier).toBe('unique-id-123');
  });

  it('retrieves shows by date', async () => {
    await addShow({
      identifier: 'show1',
      date: '1977-05-08',
      venue: 'Cornell',
      city: 'Ithaca',
      state: 'NY',
      avgRating: 4.8,
      numReviews: 100,
      sourceType: null,
      taper: null,
      lastUpdated: new Date().toISOString()
    });
    
    await addShow({
      identifier: 'show2',
      date: '1977-05-08',
      venue: 'Cornell',
      city: 'Ithaca',
      state: 'NY',
      avgRating: 4.7,
      numReviews: 90,
      sourceType: null,
      taper: null,
      lastUpdated: new Date().toISOString()
    });
    
    const shows = await getShowsByDate('1977-05-08');
    expect(shows).toHaveLength(2);
  });

  it('retrieves shows by year', async () => {
    await addShow({
      identifier: 'show1',
      date: '1977-05-08',
      venue: 'Cornell',
      city: 'Ithaca',
      state: 'NY',
      avgRating: 4.8,
      numReviews: 100,
      sourceType: null,
      taper: null,
      lastUpdated: new Date().toISOString()
    });
    
    await addShow({
      identifier: 'show2',
      date: '1977-06-09',
      venue: 'Winterland',
      city: 'San Francisco',
      state: 'CA',
      avgRating: 4.7,
      numReviews: 90,
      sourceType: null,
      taper: null,
      lastUpdated: new Date().toISOString()
    });
    
    await addShow({
      identifier: 'show3',
      date: '1978-05-08',
      venue: 'Other',
      city: 'Other',
      state: 'NY',
      avgRating: 4.0,
      numReviews: 50,
      sourceType: null,
      taper: null,
      lastUpdated: new Date().toISOString()
    });
    
    const shows = await getShowsByYear(1977);
    expect(shows).toHaveLength(2);
    expect(shows.every(s => s.date.startsWith('1977'))).toBe(true);
  });

  it('retrieves top rated shows', async () => {
    await addShow({
      identifier: 'show1',
      date: '1977-05-08',
      venue: 'Cornell',
      city: 'Ithaca',
      state: 'NY',
      avgRating: 4.8,
      numReviews: 100,
      sourceType: null,
      taper: null,
      lastUpdated: new Date().toISOString()
    });
    
    await addShow({
      identifier: 'show2',
      date: '1977-06-09',
      venue: 'Winterland',
      city: 'San Francisco',
      state: 'CA',
      avgRating: 4.9,
      numReviews: 110,
      sourceType: null,
      taper: null,
      lastUpdated: new Date().toISOString()
    });
    
    await addShow({
      identifier: 'show3',
      date: '1976-06-09',
      venue: 'Other',
      city: 'Other',
      state: 'NY',
      avgRating: 4.2,
      numReviews: 50,
      sourceType: null,
      taper: null,
      lastUpdated: new Date().toISOString()
    });
    
    const topShows = await getTopRatedShows(2);
    expect(topShows).toHaveLength(2);
    expect(topShows[0].avgRating).toBeGreaterThanOrEqual(topShows[1].avgRating);
    expect(topShows[0].identifier).toBe('show2'); // Highest rated
  });

  it('counts shows correctly', async () => {
    expect(await getShowCount()).toBe(0);

    await addShow({
      identifier: 'show1',
      date: '1977-05-08',
      venue: 'Cornell',
      city: 'Ithaca',
      state: 'NY',
      avgRating: 4.8,
      numReviews: 100,
      sourceType: null,
      taper: null,
      lastUpdated: new Date().toISOString()
    });

    expect(await getShowCount()).toBe(1);
  });

  it('searches shows by venue name', async () => {
    await addShow({
      identifier: 'show1',
      date: '1977-05-08',
      venue: 'Winterland Arena',
      city: 'San Francisco',
      state: 'CA',
      avgRating: 4.8,
      numReviews: 100,
      sourceType: null,
      taper: null,
      lastUpdated: new Date().toISOString()
    });

    await addShow({
      identifier: 'show2',
      date: '1977-06-09',
      venue: 'Winterland Ballroom',
      city: 'San Francisco',
      state: 'CA',
      avgRating: 4.7,
      numReviews: 90,
      sourceType: null,
      taper: null,
      lastUpdated: new Date().toISOString()
    });

    await addShow({
      identifier: 'show3',
      date: '1977-05-08',
      venue: 'Cornell University',
      city: 'Ithaca',
      state: 'NY',
      avgRating: 4.9,
      numReviews: 200,
      sourceType: null,
      taper: null,
      lastUpdated: new Date().toISOString()
    });

    const winterlandShows = await searchByVenue('Winterland');
    expect(winterlandShows).toHaveLength(2);
    expect(winterlandShows.every(s => s.venue.startsWith('Winterland'))).toBe(true);

    const cornellShows = await searchByVenue('Cornell');
    expect(cornellShows).toHaveLength(1);
    expect(cornellShows[0].venue).toBe('Cornell University');
  });

  it('searches venues case-insensitively', async () => {
    await addShow({
      identifier: 'show1',
      date: '1977-05-08',
      venue: 'Fillmore East',
      city: 'New York',
      state: 'NY',
      avgRating: 4.8,
      numReviews: 100,
      sourceType: null,
      taper: null,
      lastUpdated: new Date().toISOString()
    });

    const results = await searchByVenue('fillmore');
    expect(results).toHaveLength(1);
    expect(results[0].venue).toBe('Fillmore East');
  });

  it('clears all shows from database', async () => {
    await addShow({
      identifier: 'show1',
      date: '1977-05-08',
      venue: 'Test Venue 1',
      city: 'City',
      state: 'NY',
      avgRating: 4.8,
      numReviews: 100,
      sourceType: null,
      taper: null,
      lastUpdated: new Date().toISOString()
    });

    await addShow({
      identifier: 'show2',
      date: '1977-06-09',
      venue: 'Test Venue 2',
      city: 'City',
      state: 'CA',
      avgRating: 4.7,
      numReviews: 90,
      sourceType: null,
      taper: null,
      lastUpdated: new Date().toISOString()
    });

    expect(await getShowCount()).toBe(2);

    await clearAllShows();

    expect(await getShowCount()).toBe(0);
  });
});