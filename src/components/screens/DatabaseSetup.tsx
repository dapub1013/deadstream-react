import { useState } from 'react';
import { populateShowDatabase } from '../../services/populateDatabase';
import { Button } from '../atoms/Button';

/**
 * Database Setup Screen
 * Shown on first run to populate the show catalog from archive.org
 */
export function DatabaseSetup() {
  const [isPopulating, setIsPopulating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handlePopulate = async () => {
    setIsPopulating(true);
    setError(null);
    setProgress(0);

    try {
      await populateShowDatabase((progressValue) => {
        setProgress(Math.round(progressValue));
      });

      // Reload app after successful population
      window.location.reload();
    } catch (err) {
      const errorMessage = err instanceof Error
        ? err.message
        : 'Failed to populate database';
      setError(errorMessage);
      setIsPopulating(false);
      console.error('[DatabaseSetup] Population failed:', err);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-gray-50">
      <h1 className="text-4xl font-bold mb-4">DeadStream Setup</h1>

      {!isPopulating && !error && (
        <>
          <p className="text-lg mb-8 text-center max-w-md text-gray-700">
            This is your first time running DeadStream.
            We need to download the show catalog from the Internet Archive.
          </p>

          <p className="text-sm mb-8 text-center max-w-md text-gray-500">
            This will download metadata for thousands of Grateful Dead shows.
            The process may take 10-20 minutes depending on your connection.
          </p>

          <Button size="large" onClick={handlePopulate}>
            Download Show Catalog
          </Button>
        </>
      )}

      {isPopulating && (
        <>
          <div className="w-full max-w-md mb-4">
            <div className="bg-gray-200 rounded-full h-4 overflow-hidden">
              <div
                className="bg-blue-500 h-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <p className="text-2xl font-semibold mb-2">{progress}%</p>
          <p className="text-gray-600">Downloading show catalog...</p>
          <p className="text-sm text-gray-500 mt-2">This may take several minutes</p>
        </>
      )}

      {error && (
        <div className="mt-6 p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg max-w-md">
          <h3 className="font-bold mb-2">Error</h3>
          <p className="text-sm">{error}</p>
          <Button
            variant="secondary"
            className="mt-4"
            onClick={() => {
              setError(null);
              setProgress(0);
            }}
          >
            Try Again
          </Button>
        </div>
      )}
    </div>
  );
}
