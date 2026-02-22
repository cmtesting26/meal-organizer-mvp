/**
 * OnboardingScreen Component (Sprint 17 — S17-01)
 *
 * Full-screen onboarding slide layout.
 * - Illustration area: top ~60%
 * - Content area: bottom ~40% (title, description, action)
 * - Pagination dots
 * - Skip button (top-right)
 *
 * Design Spec V1.4 · Onboarding Screen component
 * Implementation Plan Phase 24
 * Roadmap V1.4 Epic 5
 */

import { type FC, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

export interface OnboardingSlide {
  id: string;
  icon: ReactNode;
  titleKey: string;
  descriptionKey: string;
}

interface OnboardingScreenProps {
  slide: OnboardingSlide;
  currentIndex: number;
  totalSlides: number;
  onNext: () => void;
  onSkip: () => void;
  isLastSlide: boolean;
}

export const OnboardingScreen: FC<OnboardingScreenProps> = ({
  slide,
  currentIndex,
  totalSlides,
  onNext,
  onSkip,
  isLastSlide,
}) => {
  const { t } = useTranslation();

  return (
    <div className="fixed inset-0 z-[100] flex flex-col" style={{ backgroundColor: 'var(--fs-bg-base, #FAF9F6)' }}>
      {/* Skip button — top right */}
      <div className="flex justify-end p-4 pb-0">
        <button
          onClick={onSkip}
          className="text-sm font-medium text-gray-500 hover:text-gray-700
                     min-w-[44px] min-h-[44px] flex items-center justify-center
                     transition-colors"
          aria-label={t('onboarding.skip')}
        >
          {t('onboarding.skip')}
        </button>
      </div>

      {/* Illustration area — ~60% */}
      <div className="flex-[3] flex items-center justify-center px-8">
        <div className="w-full max-w-xs flex items-center justify-center">
          {slide.icon}
        </div>
      </div>

      {/* Content area — ~40% */}
      <div className="flex-[2] flex flex-col items-center justify-between px-8 pb-12">
        <div className="text-center max-w-sm">
          <h2 className="text-2xl font-bold mb-3" style={{ color: 'var(--fs-text-primary, #1C1917)' }}>
            {t(slide.titleKey)}
          </h2>
          <p className="text-base leading-relaxed" style={{ color: 'var(--fs-text-secondary, #57534E)' }}>
            {t(slide.descriptionKey)}
          </p>
        </div>

        {/* Pagination dots + action button */}
        <div className="flex flex-col items-center gap-6 w-full max-w-sm">
          {/* Pagination dots */}
          <div className="flex gap-2" role="tablist" aria-label={t('onboarding.pagination')}>
            {Array.from({ length: totalSlides }).map((_, i) => (
              <div
                key={i}
                role="tab"
                aria-selected={i === currentIndex}
                aria-label={t('onboarding.slide', { current: i + 1, total: totalSlides })}
                className={`h-2 rounded-full transition-all duration-300
                  ${i === currentIndex
                    ? 'w-8 bg-amber-600'
                    : 'w-2 bg-gray-300'
                  }`}
              />
            ))}
          </div>

          {/* Action button */}
          <button
            onClick={onNext}
            className="w-full py-3.5 px-6 rounded-xl font-semibold text-base
                       bg-amber-600 text-white
                       hover:bg-amber-700 active:bg-amber-800
                       transition-colors
                       focus:outline-none focus:ring-2 focus:ring-amber-600 focus:ring-offset-2
                       min-h-[44px]"
          >
            {isLastSlide
              ? t('onboarding.getStarted')
              : t('onboarding.next')
            }
          </button>
        </div>
      </div>
    </div>
  );
};
