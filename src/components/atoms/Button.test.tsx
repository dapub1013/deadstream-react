import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click Me</Button>);
    
    fireEvent.click(screen.getByText('Click Me'));
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it('applies correct variant classes', () => {
    const { container } = render(<Button variant="secondary">Secondary</Button>);
    const button = container.querySelector('button');
    
    expect(button).toHaveClass('bg-gray-200');
  });

  it('applies correct size classes', () => {
    const { container } = render(<Button size="large">Large</Button>);
    const button = container.querySelector('button');
    
    expect(button).toHaveClass('h-touch-lg');
    expect(button).toHaveClass('w-touch-lg');
  });

  it('forwards additional props', () => {
    render(<Button disabled>Disabled</Button>);
    const button = screen.getByText('Disabled');
    
    expect(button).toBeDisabled();
  });
});