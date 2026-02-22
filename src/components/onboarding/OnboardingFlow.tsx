/**
 * OnboardingFlow Component (Sprint 17 — S17-02/03/04/05/08)
 *
 * Orchestrates the 3-screen onboarding experience:
 *   Screen 1: Weekly scheduling highlight
 *   Screen 2: Recipe import highlight
 *   Screen 3: Shared household highlight
 *
 * First-launch detection: localStorage flag 'fork-spoon-onboarding-complete'
 * Skip button on all screens.
 *
 * Two user paths (Design Spec V1.4, Flows 12-13):
 *   - New user: full 3-screen tour → continue to app (or auth)
 *   - Invite-link user: handled by OnboardingInvitePath (S17-06)
 *
 * Implementation Plan Phase 24 · Roadmap V1.4 Epic 5
 */

import { useState, useCallback, type FC } from 'react';
import { OnboardingScreen, type OnboardingSlide } from './OnboardingScreen';
import { CalendarDays, Import, Users } from 'lucide-react';

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

export const OnboardingFlow: FC<OnboardingFlowProps> = ({ onComplete }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Define the 3 onboarding slides with Lucide icons as illustrations
  const slides: OnboardingSlide[] = [
    {
      id: 'scheduling',
      icon: (
        <div className="flex items-center justify-center w-40 h-40 rounded-full bg-amber-100">
          <CalendarDays className="w-20 h-20 text-amber-600" strokeWidth={1.5} />
        </div>
      ),
      titleKey: 'onboarding.screen1.title',
      descriptionKey: 'onboarding.screen1.description',
    },
    {
      id: 'import',
      icon: (
        <div className="flex items-center justify-center w-40 h-40 rounded-full bg-emerald-100">
          <Import className="w-20 h-20 text-emerald-600" strokeWidth={1.5} />
        </div>
      ),
      titleKey: 'onboarding.screen2.title',
      descriptionKey: 'onboarding.screen2.description',
    },
    {
      id: 'household',
      icon: (
        <div className="flex items-center justify-center w-40 h-40 rounded-full" style={{ backgroundColor: '#FEF3C7' }}>
          <Users className="w-20 h-20" style={{ color: '#D97706' }} strokeWidth={1.5} />
        </div>
      ),
      titleKey: 'onboarding.screen3.title',
      descriptionKey: 'onboarding.screen3.description',
    },
  ];

  const handleNext = useCallback(() => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide((prev) => prev + 1);
    } else {
      // Last slide — complete onboarding
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
      isLastSlide={currentSlide === slides.length - 1}
    />
  );
};
