/**
 * CookingMode Component (Sprint 25)
 *
 * Full-screen cooking mode with:
 * - Auto-suggest cooking timer from step text (S25-01/02)
 * - Instant X exit — no confirmation dialog (S25-03)
 * - Global theme support — light/dark follows system (S25-04)
 * - V1.6 ingredients panel theming + step styling (S25-08)
 * - Responsive split layout (portrait 30/70, landscape side-by-side)
 * - Keyboard navigation (← → arrow keys)
 * - Timer persists across step navigation
 *
 * Design Spec V1.6 · Roadmap V1.6 Epic 5
 */

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { X, ChefHat, UtensilsCrossed, Smartphone, Timer } from 'lucide-react';
import { parseSteps, type ParsedStep } from '@/lib/stepParser';
import { matchIngredientsToSteps, type StepIngredientMap } from '@/lib/ingredientMatcher';
import { parseTimerFromStep } from '@/lib/timerParser';
import { StepNavigation } from './StepNavigation';
import { CookingTimer, type TimerData } from './CookingTimer';
import { useWakeLock } from '@/hooks/useWakeLock';
import type { Recipe } from '@/types/recipe';

interface CookingModeProps {
  recipe: Recipe;
  onExit: () => void;
}

export function CookingMode({ recipe, onExit }: CookingModeProps) {
  const { t } = useTranslation();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [showWakeLockToast, setShowWakeLockToast] = useState(false);
  // S27-05: All ingredients overlay state
  const [showAllIngredientsOverlay, setShowAllIngredientsOverlay] = useState(false);

  // ─── Timer state (lifted from CookingTimer) ───────────────────────
  // Map of stepIndex → TimerData (supports one timer per step)
  const [timers, setTimers] = useState<Map<number, TimerData>>(new Map());
  const intervalRefs = useRef<Map<number, ReturnType<typeof setInterval>>>(new Map());
  const pendingAlertRef = useRef(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  // Visual flash state for timer-done alert
  const [timerFlash, setTimerFlash] = useState(false);

  // Format mm:ss
  const formatTimerDisplay = (secs: number): string => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  /**
   * Create/resume AudioContext during a user gesture (timer start button).
   * Must be called inside a click handler so iOS Safari "blesses" the context.
   */
  const ensureAudioContext = useCallback(() => {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    if (!AC) return;
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AC();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  }, []);

  /**
   * Timer alert: Web Audio API beep + visual flash overlay.
   * The AudioContext was created/resumed during the user's tap on "Start",
   * so it should be in "running" state and allowed to produce sound.
   */
  const playAlert = useCallback(() => {
    // Vibrate on Android
    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200, 100, 200]);
    }
    // Web Audio API — play a C-E-G arpeggio chime
    const ctx = audioCtxRef.current;
    if (ctx) {
      // Resume in case it got suspended (e.g. after backgrounding)
      const play = () => {
        const now = ctx.currentTime;
        const playNote = (freq: number, start: number, dur: number) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0.4, start);
          gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(start);
          osc.stop(start + dur);
        };
        // Three rounds of C-E-G arpeggio (~3.5s total)
        for (let round = 0; round < 3; round++) {
          const offset = round * 1.1;
          playNote(1047, now + offset, 0.4);        // C6
          playNote(1319, now + offset + 0.2, 0.4);  // E6
          playNote(1568, now + offset + 0.4, 0.55); // G6
        }
      };
      if (ctx.state === 'suspended') {
        ctx.resume().then(play).catch(() => {});
      } else {
        play();
      }
    }
    // Visual flash
    setTimerFlash(true);
  }, []);

  // When the app returns from background, fire any pending alert
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible' && pendingAlertRef.current) {
        pendingAlertRef.current = false;
        playAlert();
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [playAlert]);

  // Find any running/paused timer that's NOT on the current step (for mini-bar)
  const backgroundTimer = useMemo(() => {
    for (const [stepIdx, timer] of timers.entries()) {
      if (stepIdx !== currentStepIndex && (timer.timerState === 'running' || timer.timerState === 'paused')) {
        return { stepIndex: stepIdx, timer };
      }
    }
    return null;
  }, [timers, currentStepIndex]);

  // Get timer for current step
  const currentTimer = timers.get(currentStepIndex) ?? null;

  // Check if any OTHER step has a running timer
  const otherTimerRunning = backgroundTimer !== null;

  // ─── Timer interval management ────────────────────────────────────
  // Uses targetEndTime + Date.now() so the timer catches up after backgrounding.
  useEffect(() => {
    for (const [stepIdx, timer] of timers.entries()) {
      const hasInterval = intervalRefs.current.has(stepIdx);

      if (timer.timerState === 'running' && !hasInterval) {
        const id = setInterval(() => {
          setTimers((prev) => {
            const next = new Map(prev);
            const t = next.get(stepIdx);
            if (!t || t.timerState !== 'running' || !t.targetEndTime) return prev;
            const remaining = Math.max(0, Math.round((t.targetEndTime - Date.now()) / 1000));
            if (remaining <= 0) {
              clearInterval(intervalRefs.current.get(stepIdx)!);
              intervalRefs.current.delete(stepIdx);
              next.set(stepIdx, { ...t, timerState: 'idle', remaining: 0, targetEndTime: undefined });
              playAlert();
            } else {
              next.set(stepIdx, { ...t, remaining });
            }
            return next;
          });
        }, 500); // 500ms for snappier catch-up after backgrounding
        intervalRefs.current.set(stepIdx, id);
      } else if (timer.timerState !== 'running' && hasInterval) {
        clearInterval(intervalRefs.current.get(stepIdx)!);
        intervalRefs.current.delete(stepIdx);
      }
    }

    // Cleanup intervals for deleted timers
    for (const [stepIdx, id] of intervalRefs.current.entries()) {
      if (!timers.has(stepIdx)) {
        clearInterval(id);
        intervalRefs.current.delete(stepIdx);
      }
    }
  }, [timers, playAlert]);

  // Cleanup all intervals on unmount
  useEffect(() => {
    return () => {
      for (const id of intervalRefs.current.values()) clearInterval(id);
      intervalRefs.current.clear();
    };
  }, []);

  // ─── Timer action handlers ────────────────────────────────────────
  const handleTimerStart = useCallback((seconds: number) => {
    ensureAudioContext();
    setTimers((prev) => {
      const next = new Map(prev);
      next.set(currentStepIndex, {
        timerState: 'running',
        duration: seconds,
        remaining: seconds,
        sourceStepIndex: currentStepIndex,
        targetEndTime: Date.now() + seconds * 1000,
      });
      return next;
    });
  }, [currentStepIndex, ensureAudioContext]);

  const handleTimerPause = useCallback(() => {
    setTimers((prev) => {
      const next = new Map(prev);
      const t = next.get(currentStepIndex);
      if (t) next.set(currentStepIndex, { ...t, timerState: 'paused' });
      return next;
    });
  }, [currentStepIndex]);

  const handleTimerResume = useCallback(() => {
    setTimers((prev) => {
      const next = new Map(prev);
      const t = next.get(currentStepIndex);
      if (t) next.set(currentStepIndex, {
        ...t,
        timerState: 'running',
        targetEndTime: Date.now() + t.remaining * 1000,
      });
      return next;
    });
  }, [currentStepIndex]);

  const handleTimerReset = useCallback(() => {
    setTimers((prev) => {
      const next = new Map(prev);
      next.delete(currentStepIndex);
      return next;
    });
  }, [currentStepIndex]);

  const handleTimerAdjust = useCallback((delta: number) => {
    setTimers((prev) => {
      const next = new Map(prev);
      const t = next.get(currentStepIndex);
      if (t) {
        next.set(currentStepIndex, {
          ...t,
          duration: Math.max(0, t.duration + delta),
          remaining: Math.max(0, t.remaining + delta),
        });
      } else {
        // Adjusting from suggestion (no timer entry yet) — create one
        const suggestion = parseTimerFromStep(steps[currentStepIndex]?.text ?? '');
        const base = suggestion?.seconds ?? 0;
        next.set(currentStepIndex, {
          timerState: 'idle',
          duration: Math.max(0, base + delta),
          remaining: Math.max(0, base + delta),
          sourceStepIndex: currentStepIndex,
        });
      }
      return next;
    });
  }, [currentStepIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleInitTimer = useCallback((seconds: number) => {
    setTimers((prev) => {
      const next = new Map(prev);
      next.set(currentStepIndex, {
        timerState: 'idle',
        duration: seconds,
        remaining: seconds,
        sourceStepIndex: currentStepIndex,
      });
      return next;
    });
  }, [currentStepIndex]);

  // S27-04: Navigate back to the step where a background timer is running
  const handleMiniTimerTap = useCallback(() => {
    if (backgroundTimer) {
      setCurrentStepIndex(backgroundTimer.stepIndex);
    }
  }, [backgroundTimer]);

  // Wake Lock: keep screen on during cooking
  const { isSupported: wakeLockSupported, isActive: wakeLockActive } = useWakeLock();

  useEffect(() => {
    if (!wakeLockSupported) {
      setShowWakeLockToast(true);
      const timer = setTimeout(() => setShowWakeLockToast(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [wakeLockSupported]);

  const steps: ParsedStep[] = useMemo(
    () => parseSteps(recipe.instructions),
    [recipe.instructions],
  );

  const ingredientMap: StepIngredientMap = useMemo(
    () =>
      matchIngredientsToSteps(
        recipe.ingredients,
        steps.map((s) => s.text),
      ),
    [recipe.ingredients, steps],
  );

  const totalSteps = steps.length;
  const currentStep = steps[currentStepIndex];
  const currentIngredients = ingredientMap.get(currentStepIndex) || [];

  const handlePrev = useCallback(() => {
    setCurrentStepIndex((i) => Math.max(0, i - 1));
    setShowAllIngredientsOverlay(false); // S27-05: close overlay on nav
  }, []);

  const handleNext = useCallback(() => {
    if (currentStepIndex >= totalSteps - 1) {
      onExit();
    } else {
      setCurrentStepIndex((i) => i + 1);
      setShowAllIngredientsOverlay(false); // S27-05: close overlay on nav
    }
  }, [currentStepIndex, totalSteps, onExit]);

  const handleStepChange = useCallback((index: number) => {
    setCurrentStepIndex(index);
    setShowAllIngredientsOverlay(false); // S27-05: close overlay on nav
  }, []);

  // S25-03: Instant exit — no confirmation dialog
  const handleExit = useCallback(() => {
    onExit();
  }, [onExit]);

  // Keyboard navigation: ← → arrow keys, Escape to exit immediately
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          handlePrev();
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleNext();
          break;
        case 'Escape':
          handleExit();
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrev, handleNext, handleExit]);

  // S26-10: Full-screen swipe gestures
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const SWIPE_THRESHOLD = 50;

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartX.current === null || touchStartY.current === null) return;

      const dx = e.changedTouches[0].clientX - touchStartX.current;
      const dy = e.changedTouches[0].clientY - touchStartY.current;

      // Only handle horizontal swipes (ignore vertical scrolling)
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > SWIPE_THRESHOLD) {
        if (dx < 0 && currentStepIndex < totalSteps - 1) {
          handleNext();
        } else if (dx > 0 && currentStepIndex > 0) {
          handlePrev();
        }
      }

      touchStartX.current = null;
      touchStartY.current = null;
    },
    [currentStepIndex, totalSteps, handlePrev, handleNext],
  );

  if (steps.length === 0) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ backgroundColor: 'var(--fs-bg-base)', color: 'var(--fs-text-primary)' }}
      >
        <div className="text-center px-6 max-w-md">
          <ChefHat className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--fs-text-muted)' }} />
          <p className="text-lg" style={{ color: 'var(--fs-text-secondary)' }}>{t('cookingMode.noSteps')}</p>
          <button
            onClick={onExit}
            className="mt-6 px-6 py-3 rounded-xl font-medium transition-colors"
            style={{ backgroundColor: 'var(--fs-accent)', color: 'var(--fs-text-inverse)' }}
          >
            {t('cookingMode.exitConfirm')}
          </button>
        </div>
      </div>
    );
  }

  // S25-08: V1.6 Ingredients panel
  const ingredientsPanel = (
    <div className="px-4 py-3 md:px-6 md:py-4">
      <div className="flex items-center justify-between mb-2">
        <h2
          className="flex items-center gap-1.5"
          style={{
            fontSize: '11px',
            fontWeight: 600,
            color: 'var(--fs-accent-text, #B84835)',
            textTransform: 'uppercase' as const,
            letterSpacing: '0.5px',
          }}
        >
          <UtensilsCrossed className="w-3.5 h-3.5" />
          {currentIngredients.length > 0
            ? t('cookingMode.ingredients')
            : t('cookingMode.allIngredients')}
        </h2>
        {/* S27-05: Show all ingredients toggle */}
        {recipe.ingredients.length > 0 && (
          <button
            onClick={() => setShowAllIngredientsOverlay(true)}
            className="text-xs font-medium underline transition-colors"
            style={{ color: 'var(--fs-accent, #D4644E)' }}
          >
            {t('cookingMode.showAllIngredients')}
          </button>
        )}
      </div>
      {currentIngredients.length > 0 ? (
        <ul className="space-y-2.5">
          {currentIngredients.map((ing) => (
            <li
              key={ing.index}
              className="flex items-start gap-2.5"
              style={{ fontSize: '22px', lineHeight: 1.5, color: 'var(--fs-text-primary)' }}
            >
              <span
                className="shrink-0 mt-3"
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '9999px',
                  backgroundColor: 'var(--fs-accent, #D4644E)',
                }}
              />
              <span>{ing.text}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p style={{ fontSize: '22px', lineHeight: 1.5, color: 'var(--fs-text-muted)', fontStyle: 'italic' }}>
          {t('cookingMode.noIngredientsForStep')}
        </p>
      )}
    </div>
  );

  // S25-08: V1.6 Step display
  const instructionPanel = (
    <>
      <div className="px-4 pt-4 pb-2 md:px-6 shrink-0">
        <p
          style={{
            fontSize: '12px',
            fontWeight: 600,
            color: 'var(--fs-text-muted)',
            textTransform: 'uppercase' as const,
          }}
        >
          {t('cookingMode.stepOf', { current: currentStep.stepNumber, total: totalSteps })}
        </p>
        {totalSteps > 1 && (
          <div className="flex items-center gap-1 mt-2">
            {steps.map((_, idx) => (
              <div
                key={idx}
                className="rounded-full transition-all duration-300"
                style={{
                  width: idx === currentStepIndex ? '8px' : '6px',
                  height: idx === currentStepIndex ? '8px' : '6px',
                  backgroundColor:
                    idx === currentStepIndex ? 'var(--fs-accent, #D4644E)' : 'var(--fs-border-default)',
                }}
              />
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 md:px-6">
        <p style={{ fontSize: '22px', fontWeight: 400, lineHeight: 1.5, color: 'var(--fs-text-primary)' }}>
          {currentStep.text}
        </p>
      </div>

      {/* S25-02: Cooking Timer — persists across step navigation */}
      {/* S27-03/04: Controlled timer with per-step state + mini-bar for background timers */}
      <div className="px-4 pb-2 md:px-6 shrink-0">
        <CookingTimer
          stepText={currentStep.text}
          currentStepIndex={currentStepIndex}
          timer={currentTimer}
          otherTimerRunning={otherTimerRunning}
          onStart={handleTimerStart}
          onPause={handleTimerPause}
          onResume={handleTimerResume}
          onReset={handleTimerReset}
          onAdjust={handleTimerAdjust}
          onInitTimer={handleInitTimer}
        />
      </div>
    </>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ backgroundColor: 'var(--fs-bg-base)', color: 'var(--fs-text-primary)' }}
    >
      {/* Header bar */}
      <header
        className="flex items-center justify-between px-4 py-3 md:px-6 shrink-0"
        style={{
          backgroundColor: 'var(--fs-bg-elevated)',
          borderBottom: '1px solid var(--fs-border-default)',
        }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <ChefHat className="w-5 h-5 shrink-0" style={{ color: 'var(--fs-accent, #D4644E)' }} />
          <h1 className="font-semibold truncate" style={{ fontSize: '14px', color: 'var(--fs-text-primary)' }}>
            {recipe.title}
          </h1>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {wakeLockActive && (
            <span className="flex items-center gap-1 text-[10px] text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">
              <Smartphone className="w-3 h-3" />
              <span className="hidden sm:inline">{t('cookingMode.wakeLockActive')}</span>
            </span>
          )}
          {/* S25-03: X button — instant exit */}
          <button
            onClick={handleExit}
            className="flex items-center justify-center shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--fs-accent)] focus-visible:ring-offset-1"
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '8px',
              backgroundColor: 'var(--fs-bg-elevated)',
              border: 'none',
              color: 'var(--fs-text-muted)',
            }}
            aria-label={t('cookingMode.exitConfirm')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* S26-10: Full-screen swipe gesture area */}
      <div
        className="flex-1 flex flex-col md:flex-row overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="h-[30%] md:h-auto md:w-[40%] lg:w-[35%] overflow-y-auto"
          style={{
            backgroundColor: 'var(--fs-bg-surface)',
            borderBottom: '1px solid var(--fs-border-default)',
          }}
        >
          {ingredientsPanel}
        </div>

        <div className="h-[70%] md:h-auto md:flex-1 flex flex-col">
          {instructionPanel}
          <StepNavigation
            currentIndex={currentStepIndex}
            totalSteps={totalSteps}
            onPrev={handlePrev}
            onNext={handleNext}
            onStepChange={handleStepChange}
            miniTimerSlot={backgroundTimer ? (
              <button
                onClick={handleMiniTimerTap}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl transition-colors whitespace-nowrap"
                style={{
                  backgroundColor: 'var(--fs-accent, #D4644E)',
                  color: 'var(--fs-text-inverse, #FFFFFF)',
                  minWidth: 0,
                }}
                aria-label={t('cookingMode.timerRunning', { time: formatTimerDisplay(backgroundTimer.timer.remaining) })}
              >
                <Timer className="w-3.5 h-3.5 shrink-0 animate-pulse" />
                <span className="font-bold text-xs tabular-nums">
                  {t('cookingMode.step', { current: backgroundTimer.stepIndex + 1 })}
                  {' · '}
                  {formatTimerDisplay(backgroundTimer.timer.remaining)}
                </span>
              </button>
            ) : undefined}
          />
        </div>
      </div>

      {/* S27-05: All ingredients full-screen overlay */}
      {showAllIngredientsOverlay && (
        <div
          className="fixed inset-0 z-[60] flex flex-col"
          style={{ backgroundColor: 'var(--fs-bg-base)' }}
        >
          <header
            className="flex items-center justify-between px-4 py-3 shrink-0"
            style={{
              backgroundColor: 'var(--fs-bg-elevated)',
              borderBottom: '1px solid var(--fs-border-default)',
            }}
          >
            <h2
              className="flex items-center gap-2 font-semibold"
              style={{ fontSize: '14px', color: 'var(--fs-text-primary)' }}
            >
              <UtensilsCrossed className="w-5 h-5" style={{ color: 'var(--fs-accent, #D4644E)' }} />
              {t('cookingMode.allIngredients')}
            </h2>
            <button
              onClick={() => setShowAllIngredientsOverlay(false)}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
              style={{
                backgroundColor: 'var(--fs-bg-elevated)',
                color: 'var(--fs-text-muted)',
                border: '1px solid var(--fs-border-default)',
              }}
            >
              {t('cookingMode.closeOverlay')}
            </button>
          </header>
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <ul className="space-y-3">
              {recipe.ingredients.map((ing, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2.5"
                  style={{ fontSize: '20px', lineHeight: 1.5, color: 'var(--fs-text-primary)' }}
                >
                  <span
                    className="shrink-0 mt-3"
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '9999px',
                      backgroundColor: 'var(--fs-accent, #D4644E)',
                    }}
                  />
                  <span>{ing}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* S27-04: Persistent mini-timer bar — shown when a timer is running on a different step */}
      {/* Rendered INSIDE the nav bar area to avoid overlapping the current step's timer */}

      {/* Timer-done visual flash overlay */}
      {timerFlash && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center animate-pulse pointer-events-none"
          style={{ backgroundColor: 'rgba(212, 100, 78, 0.25)' }}
        >
          <div
            className="rounded-2xl px-8 py-6 shadow-2xl text-center pointer-events-auto"
            style={{ backgroundColor: 'var(--fs-bg-elevated)', border: '2px solid var(--fs-accent, #D4644E)' }}
          >
            <Timer className="w-10 h-10 mx-auto mb-2" style={{ color: 'var(--fs-accent, #D4644E)' }} />
            <p
              className="text-lg font-bold"
              style={{ color: 'var(--fs-text-primary)', fontFamily: "'Fraunces', serif" }}
            >
              {t('cookingMode.timerDone')}
            </p>
            <button
              onClick={() => setTimerFlash(false)}
              className="mt-3 px-4 py-2 rounded-lg text-sm font-medium"
              style={{ backgroundColor: 'var(--fs-accent, #D4644E)', color: '#fff' }}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {showWakeLockToast && (
        <div className="fixed top-16 left-4 right-4 z-[60] animate-fade-in">
          <div
            className="rounded-xl px-4 py-3 text-sm shadow-lg"
            style={{
              backgroundColor: 'var(--fs-toast-bg)',
              color: 'var(--fs-toast-text)',
              border: '1px solid var(--fs-border-default)',
            }}
          >
            {t('cookingMode.wakeLockUnsupported')}
          </div>
        </div>
      )}
    </div>
  );
}
