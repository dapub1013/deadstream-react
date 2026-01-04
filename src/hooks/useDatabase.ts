import { useState, useEffect } from 'react';
import { db, getShowCount } from '../services/database';
import type { Show } from '../types/show';

/**
 * Hook to check database initialization status
 * Returns whether database is ready and show count
 */
export function useDatabase() {
  const [isReady, setIsReady] = useState(false);
  const [showCount, setShowCount] = useState(0);

  useEffect(() => {
    async function checkDatabase() {
      try {
        const count = await getShowCount();
        setShowCount(count);
        setIsReady(count > 0);
      } catch (error) {
        console.error('Database initialization failed:', error);
        setIsReady(false);
      }
    }

    checkDatabase();
  }, []);

  return { isReady, showCount, db };
}

/**
 * Hook to fetch shows based on search parameters
 * Supports filtering by date or year
 */
export function useShows(params: { date?: string; year?: number }) {
  const [shows, setShows] = useState<Show[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchShows() {
      setLoading(true);
      try {
        let results: Show[];

        if (params.date) {
          results = await db.shows.where('date').equals(params.date).toArray();
        } else if (params.year) {
          const start = `${params.year}-01-01`;
          const end = `${params.year}-12-31`;
          results = await db.shows
            .where('date')
            .between(start, end, true, true)
            .toArray();
        } else {
          results = [];
        }

        setShows(results);
      } catch (error) {
        console.error('Failed to fetch shows:', error);
        setShows([]);
      } finally {
        setLoading(false);
      }
    }

    fetchShows();
  }, [params.date, params.year]);

  return { shows, loading };
}
