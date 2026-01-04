/**
 * Example usage of database hooks
 * This file demonstrates how to use useDatabase and useShows hooks
 */

import { useDatabase, useShows } from './useDatabase';

/**
 * Example 1: Database Status Component
 * Shows database initialization status and show count
 */
export function DatabaseStatus() {
  const { isReady, showCount } = useDatabase();

  return (
    <div className="p-4 bg-gray-100 rounded">
      <h2 className="text-xl font-bold mb-2">Database Status</h2>
      <p>Ready: {isReady ? 'Yes' : 'No'}</p>
      <p>Shows in database: {showCount}</p>
    </div>
  );
}

/**
 * Example 2: Shows by Date Component
 * Displays all shows from a specific date
 */
export function ShowsByDate({ date }: { date: string }) {
  const { shows, loading } = useShows({ date });

  if (loading) {
    return <div>Loading shows...</div>;
  }

  if (shows.length === 0) {
    return <div>No shows found for {date}</div>;
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-2">Shows on {date}</h2>
      <ul>
        {shows.map((show) => (
          <li key={show.identifier} className="mb-2 p-2 bg-white rounded">
            <div className="font-semibold">{show.venue}</div>
            <div className="text-sm text-gray-600">
              {show.city}, {show.state}
            </div>
            <div className="text-sm">
              Rating: {show.avgRating.toFixed(1)} ({show.numReviews} reviews)
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Example 3: Shows by Year Component
 * Displays all shows from a specific year
 */
export function ShowsByYear({ year }: { year: number }) {
  const { shows, loading } = useShows({ year });

  if (loading) {
    return <div>Loading shows from {year}...</div>;
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-2">{year} Shows ({shows.length})</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {shows.map((show) => (
          <div key={show.identifier} className="p-3 bg-white rounded shadow">
            <div className="font-semibold">{show.date}</div>
            <div className="text-sm">{show.venue}</div>
            <div className="text-xs text-gray-500">
              {show.city}, {show.state}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Example 4: Complete Usage in App
 * Shows how to combine hooks in a real component
 */
export function ShowBrowser() {
  const { isReady, showCount } = useDatabase();
  const { shows: topShows, loading } = useShows({ year: 1977 });

  if (!isReady) {
    return (
      <div className="text-center p-8">
        <h1 className="text-2xl font-bold mb-4">DeadStream</h1>
        <p>Database not initialized. Please load shows first.</p>
        <p className="text-sm text-gray-500">Shows in database: {showCount}</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">DeadStream</h1>
      <p className="mb-4">Database contains {showCount} shows</p>

      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">1977 Shows</h2>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <p>Found {topShows.length} shows from 1977</p>
        )}
      </div>
    </div>
  );
}
