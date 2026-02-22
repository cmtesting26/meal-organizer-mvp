/**
 * Fork & Spoon Logo (Sprint 15 — Brand Kit v2)
 *
 * Uses the official brand kit assets from IconKitchen.
 * - 'icon' variant: renders the app icon PNG at requested size
 * - 'wordmark' variant: renders the header-logo SVG (icon + "Fork and Spoon" text)
 *
 * Header SVG uses Fraunces → Lora → Georgia → serif font stack.
 */

interface LogoProps {
  /** Size in pixels (applies to height; width auto-scales) */
  size?: number;
  /** 'icon' = just the mark, 'wordmark' = mark + "Fork & Spoon" text */
  variant?: 'icon' | 'wordmark';
  className?: string;
}

export function ForkAndSpoonLogo({ size = 32, variant = 'icon', className = '' }: LogoProps) {
  if (variant === 'wordmark') {
    // Header SVG ratio is 320:48 ≈ 6.67:1
    const width = Math.round(size * (320 / 48));
    return (
      <img
        src="/icons/header-logo.svg"
        alt="Fork and Spoon"
        width={width}
        height={size}
        className={className}
        style={{ height: size, width }}
      />
    );
  }

  return (
    <img
      src="/icons/icon-192.png"
      alt="Fork and Spoon"
      width={size}
      height={size}
      className={`rounded-[22.5%] ${className}`}
      style={{ height: size, width: size }}
    />
  );
}

export default ForkAndSpoonLogo;
