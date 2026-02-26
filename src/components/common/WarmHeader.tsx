/**
 * WarmHeader Component (Sprint 23)
 *
 * Reusable warm amber header bar used across all main screens.
 * Design Spec V1.6 — Component: Warm Amber Header Bar
 *
 * Variants:
 * - Schedule: Calendar icon + "Schedule" + gear icon
 * - Library:  Book icon + "Library" + gear icon
 * - Settings: Gear icon + "Settings" (no right action)
 * - Recipe Detail: Back arrow + recipe name (truncated) + vertical dots menu
 *
 * @module WarmHeader
 */

import { type ReactNode, type FC, useRef, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';

interface WarmHeaderProps {
  /** Left icon (e.g., CalendarDays, BookOpen, etc.) */
  icon?: ReactNode;
  /** Title text displayed next to the icon */
  title: string;
  /** Optional right-side action (e.g., Settings gear icon button) */
  rightAction?: ReactNode;
  /** Show back arrow button instead of left icon */
  backButton?: boolean;
  /** Callback when back arrow is pressed */
  onBack?: () => void;
  /** Optional children rendered below the title row (e.g., week navigation) */
  children?: ReactNode;
}

export const WarmHeader: FC<WarmHeaderProps> = ({
  icon,
  title,
  rightAction,
  backButton,
  onBack,
  children,
}) => {
  const headerRef = useRef<HTMLElement>(null);

  // Publish header height as a CSS custom property so downstream sticky elements can offset
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const update = () => {
      document.documentElement.style.setProperty('--fs-warm-header-h', `${el.offsetHeight}px`);
    };
    update();
    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(update);
      observer.observe(el);
      return () => observer.disconnect();
    }
  }, []);

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-40"
      style={{
        backgroundColor: 'var(--fs-warm-header-bg, transparent)',
        borderBottom: '1px solid var(--fs-warm-header-border, transparent)',
      }}
    >
      <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Title Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            {backButton ? (
              <button
                onClick={onBack}
                className="flex items-center justify-center shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--fs-accent)] focus-visible:ring-offset-1"
                style={{
                  width: '44px',
                  height: '44px',
                  backgroundColor: 'transparent',
                  border: 'none',
                }}
                aria-label="Go back"
              >
                <ArrowLeft
                  className="w-6 h-6"
                  style={{ color: 'var(--fs-text-primary, #2D2522)' }}
                />
              </button>
            ) : icon ? (
              <span
                className="shrink-0 flex items-center justify-center"
                style={{ color: 'var(--fs-accent, #D4644E)' }}
              >
                {icon}
              </span>
            ) : null}
            <h1
              className="truncate"
              style={{
                fontFamily: "'Fraunces', serif",
                fontSize: '26px',
                fontWeight: 600,
                letterSpacing: '-0.5px',
                color: 'var(--fs-text-primary, #2D2522)',
                lineHeight: 1.15,
              }}
            >
              {title}
            </h1>
          </div>
          {rightAction && (
            <div className="shrink-0 ml-2">{rightAction}</div>
          )}
        </div>

        {/* Optional children (e.g., week nav) */}
        {children}
      </div>
    </header>
  );
};

export default WarmHeader;
