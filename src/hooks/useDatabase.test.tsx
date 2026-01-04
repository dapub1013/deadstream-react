import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useDatabase, useShows } from './useDatabase';
import { addShow, clearAllShows } from '../services/database';

describe('useDatabase', () => {
  beforeEach(async () => {
    await clearAllShows();
  });

  it('returns database ready status', async () => {
    const { result } = renderHook(() => useDatabase());

    // Initially not ready (no shows)
    expect(result.current.isReady).toBe(false);
    expect(result.current.showCount).toBe(0);

    // Add a show
    await addShow({
      identifier: 'test-show',
      date: '1977-05-08',
      venue: 'Test Venue',
      city: 'Test City',
      state: 'NY',
      avgRating: 4.5,
      numReviews: 10,
      sourceType: null,
      taper: null,
      lastUpdated: new Date().toISOString()
    });

    // Re-render the hook
    const { result: result2 } = renderHook(() => useDatabase());

    await waitFor(() => {
      expect(result2.current.isReady).toBe(true);
      expect(result2.current.showCount).toBe(1);
    });
  });

  it('exposes database instance', () => {
    const { result } = renderHook(() => useDatabase());
    expect(result.current.db).toBeDefined();
  });
});

describe('useShows', () => {
  beforeEach(async () => {
    await clearAllShows();

    // Add test data
    await addShow({
      identifier: 'show1',
      date: '1977-05-08',
      venue: 'Cornell University',
      city: 'Ithaca',
      state: 'NY',
      avgRating: 4.8,
      numReviews: 100,
      sourceType: 'sbd',
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
      venue: 'Other Venue',
      city: 'Other City',
      state: 'NY',
      avgRating: 4.0,
      numReviews: 50,
      sourceType: null,
      taper: null,
      lastUpdated: new Date().toISOString()
    });
  });

  it('fetches shows by date', async () => {
    const { result } = renderHook(() => useShows({ date: '1977-05-08' }));

    // Initially loading
    expect(result.current.loading).toBe(true);
    expect(result.current.shows).toEqual([]);

    // Wait for data to load
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.shows).toHaveLength(1);
    expect(result.current.shows[0].venue).toBe('Cornell University');
  });

  it('fetches shows by year', async () => {
    const { result } = renderHook(() => useShows({ year: 1977 }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.shows).toHaveLength(2);
    expect(result.current.shows.every(s => s.date.startsWith('1977'))).toBe(true);
  });

  it('returns empty array when no params provided', async () => {
    const { result } = renderHook(() => useShows({}));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.shows).toEqual([]);
  });

  it('handles errors gracefully', async () => {
    // Pass invalid date format to trigger error path
    const { result } = renderHook(() => useShows({ date: 'invalid' }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Should return empty array on error
    expect(result.current.shows).toEqual([]);
  });

  it('updates when params change', async () => {
    const { result, rerender } = renderHook(
      ({ params }) => useShows(params),
      { initialProps: { params: { date: '1977-05-08' } } }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.shows).toHaveLength(1);

    // Change to different date
    rerender({ params: { date: '1977-06-09' } });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.shows).toHaveLength(1);
    expect(result.current.shows[0].venue).toBe('Winterland');
  });
});
