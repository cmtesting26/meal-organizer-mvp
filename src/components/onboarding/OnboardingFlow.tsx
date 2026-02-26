/**
 * OnboardingFlow Component
 *
 * Orchestrates the 4-screen onboarding experience (D3 design):
 *   Screen 0: Welcome — "Welcome to Fork & Spoon"
 *   Screen 1: Schedule — "Plan Your Week"
 *   Screen 2: Library — "Build Your Library"
 *   Screen 3: Invite — "Cook Together"
 *
 * First-launch detection: localStorage flag 'fork-spoon-onboarding-complete'
 * Skip button on all screens.
 *
 * Two user paths:
 *   - New user: full 4-screen tour → continue to app
 *   - Invite-link user: handled by OnboardingInvitePath
 */

import { useState, useCallback, type FC } from 'react';
import { OnboardingScreen, type OnboardingSlide } from './OnboardingScreen';

/** Check if onboarding has been completed */
export function isOnboardingComplete(): boolean {
  return localStorage.getItem('fork-spoon-onboarding-complete') === 'true';
}

/** Mark onboarding as complete */
export function markOnboardingComplete(): void {
  localStorage.setItem('fork-spoon-onboarding-complete', 'true');
}

interface OnboardingFlowProps {
  /** Called when onboarding finishes (complete or skip) */
  onComplete: () => void;
}

/** Illustration image — 220x220 rounded-24, matches D3 design */
function Illustration({ src, alt }: { src: string; alt: string }) {
  return (
    <img
      src={src}
      alt={alt}
      style={{
        width: 220,
        height: 220,
        borderRadius: 24,
        objectFit: 'cover',
      }}
    />
  );
}

export const OnboardingFlow: FC<OnboardingFlowProps> = ({ onComplete }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides: OnboardingSlide[] = [
    {
      id: 'welcome',
      ctaKey: 'onboarding.getStarted',
      icon: <Illustration src="/onboarding/welcome.png" alt="Fork and spoon crossed over a plate" />,
      titleKey: 'onboarding.welcome.title',
      descriptionKey: 'onboarding.welcome.description',
    },
    {
      id: 'schedule',
      icon: <Illustration src="/onboarding/schedule.png" alt="Meal planner notebook with food stickers" />,
      titleKey: 'onboarding.screen1.title',
      descriptionKey: 'onboarding.screen1.description',
    },
    {
      id: 'library',
      icon: <Illustration src="/onboarding/library.png" alt="Recipe cards stacked on a phone" />,
      titleKey: 'onboarding.screen2.title',
      descriptionKey: 'onboarding.screen2.description',
    },
    {
      id: 'invite',
      icon: <Illustration src="/onboarding/invite.png" alt="Two bowls of soup with a heart" />,
      titleKey: 'onboarding.screen3.title',
      descriptionKey: 'onboarding.screen3.description',
    },
  ];

  const handleNext = useCallback(() => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide((prev) => prev + 1);
    } else {
      markOnboardingComplete();
      onComplete();
    }
  }, [currentSlide, slides.length, onComplete]);

  const handleSkip = useCallback(() => {
    markOnboardingComplete();
    onComplete();
  }, [onComplete]);

  return (
    <OnboardingScreen
      slide={slides[currentSlide]}
      currentIndex={currentSlide}
      totalSlides={slides.length}
      onNext={handleNext}
      onSkip={handleSkip}
    />
  );
};
