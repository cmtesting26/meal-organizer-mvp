/**
 * OnboardingScreen Component
 *
 * Full-screen onboarding slide layout matching D3 design spec.
 * Layout: SkipRow → CenterArea (illustration + text) → BottomArea (dots + CTA)
 * Uses justify-content: space-between for natural vertical distribution.
 */

import { type FC, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

export interface OnboardingSlide {
  id: string;
  icon: ReactNode;
  titleKey: string;
  descriptionKey: string;
  /** Override the CTA button label (translation key). Defaults to 'onboarding.next'. */
  ctaKey?: string;
}

interface OnboardingScreenProps {
  slide: OnboardingSlide;
  currentIndex: number;
  totalSlides: number;
  onNext: () => void;
  onSkip: () => void;
}

export const OnboardingScreen: FC<OnboardingScreenProps> = ({
  slide,
  currentIndex,
  totalSlides,
  onNext,
  onSkip,
}) => {
  const { t } = useTranslation();

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col justify-between"
      style={{ backgroundColor: '#FAF8F6' }}
    >
      {/* Skip row — top right */}
      <div
        className="flex items-center justify-end"
        style={{ height: 44, padding: '16px 24px' }}
      >
        <button
          onClick={onSkip}
          className="transition-colors"
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 14,
            fontWeight: 500,
            color: '#7A6E66',
          }}
          aria-label={t('onboarding.skip')}
        >
          {t('onboarding.skip')}
        </button>
      </div>

      {/* Center area — illustration + text */}
      <div
        className="flex flex-col items-center"
        style={{ padding: '0 24px' }}
      >
        {/* Illustration */}
        {slide.icon}

        {/* Text area */}
        <div
          className="flex flex-col items-center"
          style={{ marginTop: 32, width: '100%' }}
        >
          <h2
            className="text-center"
            style={{
              fontFamily: "'Fraunces', serif",
              fontSize: 26,
              fontWeight: 600,
              letterSpacing: '-0.5px',
              color: '#2D2522',
              lineHeight: 1.2,
            }}
          >
            {t(slide.titleKey)}
          </h2>
          <p
            className="text-center"
            style={{
              marginTop: 10,
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 15,
              fontWeight: 400,
              color: '#7A6E66',
              lineHeight: 1.5,
              maxWidth: 280,
            }}
          >
            {t(slide.descriptionKey)}
          </p>
        </div>
      </div>

      {/* Bottom area — dots + CTA */}
      <div
        className="flex flex-col items-center"
        style={{ padding: '0 24px 48px 24px', gap: 20 }}
      >
        {/* Pagination dots */}
        <div
          className="flex"
          style={{ gap: 8 }}
          role="tablist"
          aria-label={t('onboarding.pagination')}
        >
          {Array.from({ length: totalSlides }).map((_, i) => (
            <div
              key={i}
              role="tab"
              aria-selected={i === currentIndex}
              aria-label={t('onboarding.slide', { current: i + 1, total: totalSlides })}
              className="rounded-full transition-colors duration-300"
              style={{
                width: 8,
                height: 8,
                backgroundColor: i === currentIndex ? '#D4644E' : '#E8DDD8',
              }}
            />
          ))}
        </div>

        {/* CTA button */}
        <button
          onClick={onNext}
          className="w-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
          style={{
            height: 48,
            borderRadius: 14,
            backgroundColor: '#D4644E',
            color: '#FFFFFF',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 16,
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer',
          }}
        >
          {t(slide.ctaKey || 'onboarding.next')}
        </button>
      </div>
    </div>
  );
};
