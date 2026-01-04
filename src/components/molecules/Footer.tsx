import { useAudio } from '../../contexts/AudioContext';

/**
 * Footer component showing currently playing track
 */
export function Footer() {
  const { currentShow, currentTrack, playerState } = useAudio();

  if (!currentShow || !currentTrack) {
    return (
      <footer className="bg-gray-800 text-white px-4 py-2 text-center">
        <p className="text-sm text-gray-400">No show playing</p>
      </footer>
    );
  }

  return (
    <footer className="bg-gray-800 text-white px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-touch font-semibold truncate">
            {currentShow.venue}
          </p>
          <p className="text-sm text-gray-300 truncate">
            {currentTrack.title}
          </p>
        </div>

        <div className="ml-4">
          <span className="text-sm px-3 py-1 bg-gray-700 rounded-full">
            {playerState}
          </span>
        </div>
      </div>
    </footer>
  );
}
