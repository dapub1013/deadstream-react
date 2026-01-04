import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DatabaseSetup } from './DatabaseSetup';

// Mock the populateDatabase service
vi.mock('../../services/populateDatabase', () => ({
  populateShowDatabase: vi.fn()
}));

describe('DatabaseSetup', () => {
  it('renders initial state correctly', () => {
    render(<DatabaseSetup />);

    expect(screen.getByText('DeadStream Setup')).toBeInTheDocument();
    expect(screen.getByText(/This is your first time running DeadStream/i)).toBeInTheDocument();
    expect(screen.getByText('Download Show Catalog')).toBeInTheDocument();
  });

  it('shows progress bar when populating', async () => {
    const { populateShowDatabase } = await import('../../services/populateDatabase');

    // Mock the population to report progress
    vi.mocked(populateShowDatabase).mockImplementation(async (onProgress) => {
      if (onProgress) {
        onProgress(50);
      }
      return Promise.resolve();
    });

    render(<DatabaseSetup />);

    const button = screen.getByText('Download Show Catalog');
    fireEvent.click(button);

    // Wait for populating state
    await vi.waitFor(() => {
      expect(screen.getByText(/Downloading show catalog/i)).toBeInTheDocument();
    });
  });

  it('displays error message on failure', async () => {
    const { populateShowDatabase } = await import('../../services/populateDatabase');

    // Mock the population to fail
    vi.mocked(populateShowDatabase).mockRejectedValue(
      new Error('Network error')
    );

    render(<DatabaseSetup />);

    const button = screen.getByText('Download Show Catalog');
    fireEvent.click(button);

    // Wait for error state
    await vi.waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('shows try again button after error', async () => {
    const { populateShowDatabase } = await import('../../services/populateDatabase');

    vi.mocked(populateShowDatabase).mockRejectedValue(
      new Error('Test error')
    );

    render(<DatabaseSetup />);

    const button = screen.getByText('Download Show Catalog');
    fireEvent.click(button);

    // Wait for error state
    await vi.waitFor(() => {
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });

    // Click try again
    const tryAgainButton = screen.getByText('Try Again');
    fireEvent.click(tryAgainButton);

    // Error should be cleared
    expect(screen.queryByText('Error')).not.toBeInTheDocument();
  });
});
