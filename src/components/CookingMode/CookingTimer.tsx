/**
 * CookingTimer Component (Sprint 25, refactored Sprint 27)
 *
 * Controlled timer component — all state owned by parent (CookingMode).
 * Displays auto-suggested or manual timer for the CURRENT step.
 * When a timer is already running on another step, this shows the
 * current step's own suggestion independently.
 *
 * Source: Roadmap V1.6 Epic 5, Design Specification V1.6 — Cooking Mode Timer
 */

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Minus, Plus, Play, Pause, RotateCcw, Sparkles, Timer } from 'lucide-react';
import { parseTimerFromStep, type TimerSuggestion } from '@/lib/timerParser';

export interface TimerData {
  timerState: 'idle' | 'running' | 'paused';
  duration: number;
  remaining: number;
  sourceStepIndex: number;
}

interface CookingTimerProps {
  stepText: string;
  currentStepIndex: number;
  /** The timer for this specific step (null if none initialized here yet) */
  timer: TimerData | null;
  /** Whether a timer is running on a DIFFERENT step */
  otherTimerRunning: boolean;
  onStart: (seconds: number) => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
  onAdjust: (delta: number) => void;
  /** Called when user wants to initialize a timer on this step (manual "Set Timer") */
  onInitTimer: (seconds: number) => void;
}

// Format mm:ss
function formatDisplay(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function CookingTimer({
  stepText,
  currentStepIndex: _currentStepIndex,
  timer,
  otherTimerRunning: _otherTimerRunning,
  onStart,
  onPause,
  onResume,
  onReset,
  onAdjust,
  onInitTimer,
}: CookingTimerProps) {
  const { t } = useTranslation();

  const suggestion: TimerSuggestion | null = useMemo(
    () => parseTimerFromStep(stepText),
    [stepText],
  );

  // If we have an active timer on this step, use its state; otherwise use suggestion values
  const timerState = timer?.timerState ?? 'idle';
  const duration = timer?.duration ?? suggestion?.seconds ?? 0;
  const remaining = timer?.remaining ?? suggestion?.seconds ?? 0;
  const isActive = timerState === 'running' || timerState === 'paused';
  const isPulsing = timerState === 'running' && remaining <= 10 && remaining > 0;
  const progress = duration > 0 ? ((duration - remaining) / duration) * 100 : 0;

  // S27-03: If no suggestion, no active timer on this step, show "Set Timer" button
  if (!suggestion && !isActive && !timer) {
    return (
      <button
        onClick={() => onInitTimer(0)}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium text-sm transition-colors"
        style={{
          backgroundColor: 'var(--fs-bg-surface)',
          border: '1px solid var(--fs-border-default)',
          color: 'var(--fs-text-secondary)',
        }}
      >
        <Timer className="w-4 h-4" />
        {t('cookingMode.setTimer')}
      </button>
    );
  }

  return (
    <div
      className="rounded-2xl p-4"
      style={{
        backgroundColor: 'var(--fs-bg-surface)',
        border: '1px solid var(--fs-border-default)',
      }}
    >
      {/* Auto-suggest badge */}
      {suggestion && timerState === 'idle' && (
        <div className="flex items-center justify-center mb-3">
          <span
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full"
            style={{
              backgroundColor: 'var(--fs-accent, #D4644E)',
              color: 'var(--fs-text-inverse, #FFFFFF)',
              fontSize: '11px',
              fontWeight: 600,
            }}
          >
            <Sparkles className="w-3 h-3" />
            {t('cookingMode.timerDetected', { time: suggestion.label })}
          </span>
        </div>
      )}

      {/* Timer display + controls */}
      <div className="flex items-center justify-center gap-4">
        {/* Minus button */}
        <button
          onClick={() => onAdjust(-30)}
          disabled={remaining <= 0 && !isActive}
          className="flex items-center justify-center shrink-0 transition-colors"
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '8px',
            backgroundColor: 'var(--fs-bg-elevated)',
            border: 'none',
            color: 'var(--fs-text-muted)',
            cursor: remaining <= 0 && !isActive ? 'not-allowed' : 'pointer',
            opacity: remaining <= 0 && !isActive ? 0.4 : 1,
          }}
          aria-label={t('cookingMode.timerMinus30')}
        >
          <Minus className="w-4 h-4" />
        </button>

        {/* Time display */}
        <div className="text-center">
          <div
            className={isPulsing ? 'animate-pulse' : ''}
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '40px',
              fontWeight: 700,
              fontVariantNumeric: 'tabular-nums',
              color: isActive ? 'var(--fs-accent, #D4644E)' : 'var(--fs-text-primary)',
              lineHeight: 1,
            }}
          >
            {formatDisplay(remaining)}
          </div>

          {/* Progress bar (shown when active) */}
          {isActive && (
            <div
              className="mx-auto mt-2"
              style={{
                width: '120px',
                height: '3px',
                backgroundColor: 'var(--fs-border-default)',
                borderRadius: '9999px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${progress}%`,
                  height: '100%',
                  backgroundColor: 'var(--fs-accent, #D4644E)',
                  borderRadius: '9999px',
                  transition: 'width 1s linear',
                }}
              />
            </div>
          )}
        </div>

        {/* Plus button */}
        <button
          onClick={() => onAdjust(30)}
          className="flex items-center justify-center shrink-0 transition-colors"
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '8px',
            backgroundColor: 'var(--fs-bg-elevated)',
            border: 'none',
            color: 'var(--fs-text-muted)',
          }}
          aria-label={t('cookingMode.timerPlus30')}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 mt-4">
        {timerState === 'idle' && (
          <button
            onClick={() => onStart(remaining)}
            disabled={remaining <= 0}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-colors"
            style={{
              backgroundColor: remaining > 0 ? 'var(--fs-accent, #D4644E)' : 'var(--fs-bg-elevated)',
              color: remaining > 0 ? 'var(--fs-text-inverse, #FFFFFF)' : 'var(--fs-text-muted)',
              cursor: remaining > 0 ? 'pointer' : 'not-allowed',
            }}
          >
            <Play className="w-4 h-4" />
            {t('cookingMode.timerStart')}
          </button>
        )}

        {timerState === 'running' && (
          <>
            <button
              onClick={onReset}
              className="flex items-center justify-center gap-1 px-4 py-2.5 rounded-xl font-bold text-sm transition-colors"
              style={{
                backgroundColor: 'var(--fs-bg-elevated)',
                color: 'var(--fs-text-muted)',
              }}
              aria-label={t('cookingMode.timerReset', 'Reset timer')}
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={onPause}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-colors"
              style={{
                backgroundColor: 'var(--fs-bg-elevated)',
                color: 'var(--fs-text-primary)',
              }}
            >
              <Pause className="w-4 h-4" />
              {t('cookingMode.timerPause')}
            </button>
          </>
        )}

        {timerState === 'paused' && (
          <>
            <button
              onClick={onReset}
              className="flex items-center justify-center gap-1 px-4 py-2.5 rounded-xl font-bold text-sm transition-colors"
              style={{
                backgroundColor: 'var(--fs-bg-elevated)',
                color: 'var(--fs-text-muted)',
              }}
              aria-label={t('cookingMode.timerReset', 'Reset timer')}
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={onResume}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-colors"
              style={{
                backgroundColor: 'var(--fs-accent, #D4644E)',
                color: 'var(--fs-text-inverse, #FFFFFF)',
              }}
            >
              <Play className="w-4 h-4" />
              {t('cookingMode.timerResume')}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
