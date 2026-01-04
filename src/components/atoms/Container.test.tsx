import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Container } from './Container';

describe('Container', () => {
  it('renders children correctly', () => {
    const { getByText } = render(
      <Container>
        <div>Test Content</div>
      </Container>
    );

    expect(getByText('Test Content')).toBeInTheDocument();
  });

  it('applies default padding classes', () => {
    const { container } = render(
      <Container>
        <div>Content</div>
      </Container>
    );

    const containerDiv = container.firstChild;
    expect(containerDiv).toHaveClass('w-full', 'h-full', 'px-4', 'py-4');
  });

  it('allows custom className', () => {
    const { container } = render(
      <Container className="bg-blue-500">
        <div>Content</div>
      </Container>
    );

    const containerDiv = container.firstChild;
    expect(containerDiv).toHaveClass('bg-blue-500');
    expect(containerDiv).toHaveClass('w-full', 'h-full', 'px-4', 'py-4');
  });
});
