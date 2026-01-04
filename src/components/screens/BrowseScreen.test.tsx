import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowseScreen } from './BrowseScreen';

describe('BrowseScreen', () => {
  it('renders placeholder content', () => {
    render(<BrowseScreen />);

    expect(screen.getByText('Browse Shows')).toBeInTheDocument();
    expect(screen.getByText(/Phase 7/)).toBeInTheDocument();
  });

  it('displays feature list', () => {
    render(<BrowseScreen />);

    expect(screen.getByText(/Date picker, Year browser, Venue search, Show list/)).toBeInTheDocument();
  });
});
