import { Container } from '../atoms/Container';

/**
 * Player Screen - Playback controls and now playing
 * Placeholder for Phase 8 implementation
 */
export function PlayerScreen() {
  return (
    <Container>
      <div className="flex flex-col items-center justify-center h-full">
        <h2 className="text-2xl font-bold mb-4">Player</h2>
        <p className="text-gray-600">
          Phase 8: Player screen will be implemented here
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Features: Playback controls, Progress bar, Setlist display, Now Playing info
        </p>
      </div>
    </Container>
  );
}
