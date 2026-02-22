/**
 * StepNavigation Component (Sprint 19, updated Sprint 20)
 *
 * Swipe gesture navigation (left/right) and prev/next buttons for cooking steps.
 * Both ingredients and instruction panels advance simultaneously via onStepChange.
 *
 * Disable back on step 1, show "Finish" on last step.
 * Theme-aware: follows app light/dark mode via CSS token system.
 *
 * Implementation Plan Phase 26 · Roadmap V1.5 Epic 1
 */

import { useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';

interface StepNavigationProps {
  currentIndex: number;
  totalSteps: number;
  onPrev: () => void;
  onNext: () => void;
  onStepChange: (index: number) => void;
  /** Optional slot rendered between Previous and Next buttons (e.g. mini-timer) */
  miniTimerSlot?: React.ReactNode;
}

const SWIPE_THRESHOLD = 50; // Minimum px to count as a swipe

export function StepNavigation({
  currentIndex,
  totalSteps,
  onPrev,
  onNext,
  miniTimerSlot,
}: StepNavigationProps) {
  const { t } = useTranslation();
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const isFirst = currentIndex === 0;
  const isLast = currentIndex >= totalSteps - 1;

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
        if (dx < 0 && !isLast) {
          // Swipe left → next step
          onNext();
        } else if (dx > 0 && !isFirst) {
          // Swipe right → previous step
          onPrev();
        }
      }

      touchStartX.current = null;
      touchStartY.current = null;
    },
    [isFirst, isLast, onPrev, onNext],
  );

  return (
    <div
      className="shrink-0 px-4 pb-4 pt-2"
      style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="flex items-center gap-3">
        {/* Previous button */}
        <button
          onClick={onPrev}
          disabled={isFirst}
          className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl font-medium text-sm transition-all"
          style={{
            backgroundColor: isFirst ? 'var(--fs-bg-surface)' : 'var(--fs-bg-elevated)',
            color: isFirst ? 'var(--fs-text-muted)' : 'var(--fs-text-primary)',
            border: '1px solid var(--fs-border-default)',
            cursor: isFirst ? 'not-allowed' : 'pointer',
            opacity: isFirst ? 0.5 : 1,
          }}
          aria-label={t('cookingMode.previousStep')}
        >
          <ChevronLeft className="w-4 h-4" />
          {t('cookingMode.previousStep')}
        </button>

        {/* Mini-timer slot or spacer */}
        {miniTimerSlot ? (
          <div className="flex-1 flex justify-center min-w-0">
            {miniTimerSlot}
          </div>
        ) : (
          <div className="flex-1" />
        )}

        {/* Next / Finish button */}
        <button
          onClick={onNext}
          className={`flex items-center justify-center gap-1.5 px-6 py-3 rounded-xl font-medium text-sm transition-all
            ${
              isLast
                ? 'bg-green-600 text-white hover:bg-green-700 active:bg-green-800'
                : 'text-white hover:opacity-90 active:opacity-80'
            }`}
          style={isLast ? undefined : { backgroundColor: 'var(--fs-accent)', color: 'var(--fs-text-inverse)' }}
          aria-label={isLast ? t('cookingMode.finish') : t('cookingMode.nextStep')}
        >
          {isLast ? (
            <>
              <Check className="w-4 h-4" />
              {t('cookingMode.finish')}
            </>
          ) : (
            <>
              {t('cookingMode.nextStep')}
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
