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
  /** Background color (default: #FAFAF9 — Warm Stone 50) */
  backgroundColor?: string;
  /** Callback when splash finishes */
  onComplete?: () => void;
  /** Path to app icon (default: /icon-512.png) */
  iconSrc?: string;
}

const SplashScreen = ({
  duration = 400,
  backgroundColor = '#FAFAF9',
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
        backgroundColor,
        opacity: phase === 'complete' ? 0 : 1,
        transition: 'opacity 0.4s ease-out',
        zIndex: 9999,
      }}
    >
      {/* S26-14: Icon with circular clip — no white frame */}
      <div
        style={{
          animation: `splashFadeScale ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) forwards`,
        }}
      >
        <img
          src={iconSrc}
          alt="Fork and Spoon"
          style={{
            width: 120,
            height: 120,
            borderRadius: '50%',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)',
            objectFit: 'cover',
          }}
        />
      </div>

      {/* App name with staggered fade+slide */}
      <div
        style={{
          animation: `splashFadeUp ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) 200ms forwards`,
          opacity: 0,
          marginTop: 20,
        }}
      >
        <span
          style={{
            fontFamily: "'Fraunces', 'Lora', Georgia, serif",
            fontSize: 28,
            fontWeight: 600,
            color: '#1C1917',
            letterSpacing: '-0.5px',
          }}
        >
          Fork and Spoon
        </span>
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
