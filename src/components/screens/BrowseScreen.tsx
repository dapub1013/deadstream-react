import { Container } from '../atoms/Container';

/**
 * Browse Screen - Show browsing and search
 * Placeholder for Phase 7 implementation
 */
export function BrowseScreen() {
  return (
    <Container>
      <div className="flex flex-col items-center justify-center h-full">
        <h2 className="text-2xl font-bold mb-4">Browse Shows</h2>
        <p className="text-gray-600">
          Phase 7: Browse screen will be implemented here
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Features: Date picker, Year browser, Venue search, Show list
        </p>
      </div>
    </Container>
  );
}
