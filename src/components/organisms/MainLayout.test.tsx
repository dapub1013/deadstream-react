import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MainLayout } from './MainLayout';
import { NavigationProvider } from '../../contexts/NavigationContext';
import { AudioProvider } from '../../contexts/AudioContext';

// Wrapper with all required providers
function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <NavigationProvider>
      <AudioProvider>
        {children}
      </AudioProvider>
    </NavigationProvider>
  );
}

describe('MainLayout', () => {
  it('renders children in main content area', () => {
    render(
      <TestWrapper>
        <MainLayout>
          <div>Test Content</div>
        </MainLayout>
      </TestWrapper>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('renders header with app title', () => {
    render(
      <TestWrapper>
        <MainLayout>
          <div>Content</div>
        </MainLayout>
      </TestWrapper>
    );

    expect(screen.getByText('DeadStream')).toBeInTheDocument();
  });

  it('renders navigation buttons in header', () => {
    render(
      <TestWrapper>
        <MainLayout>
          <div>Content</div>
        </MainLayout>
      </TestWrapper>
    );

    expect(screen.getByText('Browse')).toBeInTheDocument();
    expect(screen.getByText('Player')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('renders footer', () => {
    render(
      <TestWrapper>
        <MainLayout>
          <div>Content</div>
        </MainLayout>
      </TestWrapper>
    );

    // Footer shows "No show playing" when no audio is loaded
    expect(screen.getByText('No show playing')).toBeInTheDocument();
  });

  it('applies correct layout structure', () => {
    const { container } = render(
      <TestWrapper>
        <MainLayout>
          <div>Content</div>
        </MainLayout>
      </TestWrapper>
    );

    // Check for flex column layout
    const layoutDiv = container.querySelector('.flex.flex-col.h-screen');
    expect(layoutDiv).toBeInTheDocument();

    // Check for main content area with overflow
    const main = container.querySelector('main.flex-1.overflow-y-auto');
    expect(main).toBeInTheDocument();
  });
});
