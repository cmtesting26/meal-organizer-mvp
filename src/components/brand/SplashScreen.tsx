import { useState, useEffect } from 'react';

/**
 * Fork and Spoon — Splash Screen
 *
 * Animated loading screen with fade+scale entrance.
 * Uses Fraunces serif font (falls back to Lora → Georgia → serif).
 *
 * Usage:
 *   <SplashScreen onComplete={() => setReady(true)} />
 */

interface SplashScreenProps {
  /** Animation duration in ms (default: 400, per spec: 300-500ms) */
  duration?: number;
  /** Background color (default: #FAF8F6 — Cream) */
  backgroundColor?: string;
  /** Callback when splash finishes */
  onComplete?: () => void;
  /** Path to app icon (default: /icon-512.png) */
  iconSrc?: string;
}

const SplashScreen = ({
  duration = 400,
  backgroundColor = 'var(--fs-bg-base, #FAF8F6)',
  onComplete = () => {},
  iconSrc = '/icon-512.png',
}: SplashScreenProps) => {
  const [phase, setPhase] = useState<'animating' | 'holding' | 'complete' | 'hidden'>('animating');

  useEffect(() => {
    // S26-14: Animation (400ms) → Hold (2600ms = 3s total visible) → Fade out (400ms)
    const t1 = setTimeout(() => setPhase('holding'), duration);
    const t2 = setTimeout(() => setPhase('complete'), 3000); // Start fade at 3s
    const t3 = setTimeout(() => {
      setPhase('hidden');
      onComplete();
    }, 3400); // Hidden after 3s + 400ms fade
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [duration, onComplete]);

  if (phase === 'hidden') return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        backgroundColor,
        opacity: phase === 'complete' ? 0 : 1,
        transition: 'opacity 0.4s ease-out',
        zIndex: 9999,
      }}
    >
      {/* App icon with rounded corners */}
      <div
        style={{
          animation: `splashFadeScale ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) forwards`,
        }}
      >
        <img
          src={iconSrc}
          alt="Fork & Spoon"
          style={{
            width: 80,
            height: 80,
            borderRadius: 18,
            objectFit: 'cover',
          }}
        />
      </div>

      {/* App name */}
      <div
        style={{
          animation: `splashFadeUp ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) 200ms forwards`,
          opacity: 0,
        }}
      >
        <span
          style={{
            fontFamily: "'Fraunces', 'Lora', Georgia, serif",
            fontSize: 32,
            fontWeight: 600,
            color: 'var(--fs-text-primary, #2D2522)',
            letterSpacing: '-0.5px',
          }}
        >
          Fork &amp; Spoon
        </span>
      </div>

      {/* Tagline */}
      <div
        style={{
          animation: `splashFadeUp ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) 300ms forwards`,
          opacity: 0,
          marginTop: -4,
        }}
      >
        <span
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 15,
            fontWeight: 400,
            color: 'var(--fs-text-secondary, #7A6E66)',
          }}
        >
          Your household recipe planner
        </span>
      </div>

      {/* Accent bar */}
      <div
        style={{
          animation: `splashFadeUp ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) 400ms forwards`,
          opacity: 0,
        }}
      >
        <div
          style={{
            width: 40,
            height: 4,
            borderRadius: 9999,
            backgroundColor: 'var(--fs-accent, #D4644E)',
          }}
        />
      </div>

      <style>{`
        @keyframes splashFadeScale {
          from { opacity: 0; transform: scale(0.85); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes splashFadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default SplashScreen;
