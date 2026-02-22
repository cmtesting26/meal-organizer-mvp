/**
 * PWA Rebrand Verification Tests (Sprint 17 — S17-14)
 *
 * Verifies:
 * - SplashScreen renders with correct timing (400ms per spec)
 * - SplashScreen shows brand elements (logo, app name)
 * - SplashScreen calls onComplete after animation
 * - Brand logo component renders icon and wordmark variants
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import SplashScreen from '../../src/components/brand/SplashScreen';
import { ForkAndSpoonLogo } from '../../src/components/brand/ForkAndSpoonLogo';

describe('SplashScreen', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('renders with app name', () => {
    render(<SplashScreen onComplete={vi.fn()} />);
    expect(screen.getByText('Fork and Spoon')).toBeInTheDocument();
  });

  it('renders app icon', () => {
    render(<SplashScreen onComplete={vi.fn()} />);
    expect(screen.getByAltText('Fork and Spoon')).toBeInTheDocument();
  });

  it('S26-14: extends splash to 3s visible, then fades out', () => {
    const onComplete = vi.fn();
    render(<SplashScreen onComplete={onComplete} />);

    // Should not complete before 3s
    act(() => vi.advanceTimersByTime(2999));
    expect(onComplete).not.toHaveBeenCalled();

    // After 3s visible + 400ms fade = 3400ms total
    act(() => vi.advanceTimersByTime(401));
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('uses Warm Stone 50 background color by default', () => {
    const { container } = render(<SplashScreen onComplete={vi.fn()} />);
    const splash = container.firstChild as HTMLElement;
    expect(splash.style.backgroundColor).toBe('rgb(250, 250, 249)');
  });

  it('hides after onComplete', () => {
    const { container } = render(<SplashScreen onComplete={vi.fn()} />);

    // Advance past full animation + hold + fade (3400ms)
    act(() => vi.advanceTimersByTime(3500));

    // Should be null (hidden phase)
    expect(container.firstChild).toBeNull();
  });

  afterEach(() => {
    vi.useRealTimers();
  });
});

describe('ForkAndSpoonLogo', () => {
  it('renders icon variant by default', () => {
    render(<ForkAndSpoonLogo size={32} />);
    const img = screen.getByAltText('Fork and Spoon');
    expect(img).toHaveAttribute('src', '/icons/icon-192.png');
    expect(img.style.width).toBe('32px');
    expect(img.style.height).toBe('32px');
  });

  it('renders wordmark variant', () => {
    render(<ForkAndSpoonLogo size={48} variant="wordmark" />);
    const img = screen.getByAltText('Fork and Spoon');
    expect(img).toHaveAttribute('src', '/icons/header-logo.svg');
  });

  it('applies custom className', () => {
    render(<ForkAndSpoonLogo className="test-class" />);
    const img = screen.getByAltText('Fork and Spoon');
    expect(img.className).toContain('test-class');
  });
});
