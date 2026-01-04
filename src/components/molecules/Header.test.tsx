import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Header } from './Header';
import { NavigationProvider } from '../../contexts/NavigationContext';

describe('Header', () => {
  it('renders navigation buttons', () => {
    render(
      <NavigationProvider>
        <Header />
      </NavigationProvider>
    );

    expect(screen.getByText('Browse')).toBeInTheDocument();
    expect(screen.getByText('Player')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('renders app title', () => {
    render(
      <NavigationProvider>
        <Header />
      </NavigationProvider>
    );

    expect(screen.getByText('DeadStream')).toBeInTheDocument();
  });

  it('highlights active screen button', () => {
    render(
      <NavigationProvider initialScreen="player">
        <Header />
      </NavigationProvider>
    );

    const playerButton = screen.getByText('Player');
    const browseButton = screen.getByText('Browse');

    // Player button should be primary (active)
    expect(playerButton.closest('button')).toHaveClass('bg-blue-500');

    // Browse button should be secondary (inactive)
    expect(browseButton.closest('button')).toHaveClass('bg-gray-200');
  });

  it('navigates when buttons are clicked', () => {
    render(
      <NavigationProvider>
        <Header />
      </NavigationProvider>
    );

    const playerButton = screen.getByText('Player');
    const settingsButton = screen.getByText('Settings');

    // Initially browse should be active
    expect(screen.getByText('Browse').closest('button')).toHaveClass('bg-blue-500');

    // Click player
    fireEvent.click(playerButton);
    expect(playerButton.closest('button')).toHaveClass('bg-blue-500');

    // Click settings
    fireEvent.click(settingsButton);
    expect(settingsButton.closest('button')).toHaveClass('bg-blue-500');
  });
});
