import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NavigationProvider, useNavigation } from './NavigationContext';

// Test component that uses navigation
function TestComponent() {
  const { currentScreen, navigateTo } = useNavigation();

  return (
    <div>
      <div data-testid="current-screen">{currentScreen}</div>
      <button onClick={() => navigateTo('browse')}>Browse</button>
      <button onClick={() => navigateTo('player')}>Player</button>
      <button onClick={() => navigateTo('settings')}>Settings</button>
    </div>
  );
}

describe('NavigationContext', () => {
  it('provides default screen as browse', () => {
    render(
      <NavigationProvider>
        <TestComponent />
      </NavigationProvider>
    );

    expect(screen.getByTestId('current-screen')).toHaveTextContent('browse');
  });

  it('allows setting initial screen', () => {
    render(
      <NavigationProvider initialScreen="player">
        <TestComponent />
      </NavigationProvider>
    );

    expect(screen.getByTestId('current-screen')).toHaveTextContent('player');
  });

  it('navigates between screens', () => {
    render(
      <NavigationProvider>
        <TestComponent />
      </NavigationProvider>
    );

    // Start on browse
    expect(screen.getByTestId('current-screen')).toHaveTextContent('browse');

    // Navigate to player
    fireEvent.click(screen.getByText('Player'));
    expect(screen.getByTestId('current-screen')).toHaveTextContent('player');

    // Navigate to settings
    fireEvent.click(screen.getByText('Settings'));
    expect(screen.getByTestId('current-screen')).toHaveTextContent('settings');

    // Navigate back to browse
    fireEvent.click(screen.getByText('Browse'));
    expect(screen.getByTestId('current-screen')).toHaveTextContent('browse');
  });

  it('throws error when used outside provider', () => {
    // Suppress console.error for this test
    const originalError = console.error;
    console.error = () => {};

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useNavigation must be used within NavigationProvider');

    console.error = originalError;
  });
});
