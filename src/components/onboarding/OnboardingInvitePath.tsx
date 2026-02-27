/**
 * OnboardingInvitePath (Sprint 17 — S17-06)
 *
 * Invite-link user path (Design Spec V1.4, Flow 13):
 *   1. Detect invite code in URL (?invite=<code>)
 *   2. Skip intro tour
 *   3. Account creation → join household → brief highlights
 *
 * Brief highlights: condensed single-screen overview instead of 3-screen tour.
 *
 * Implementation Plan Phase 24 · Roadmap V1.4 Epic 5
 */

import { type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarDays, Import, Users, ArrowRight } from 'lucide-react';
import { markOnboardingComplete } from './OnboardingFlow';

/** Check if current URL has an invite code */
export function getInviteCode(): string | null {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('invite');
  // S27-01: Persist invite code in sessionStorage so it survives the full onboarding flow
  if (code) {
    sessionStorage.setItem('fork-spoon-invite-code', code);
  }
  return code;
}

/** Check if user arrived via invite link */
export function isInviteFlow(): boolean {
  return getInviteCode() !== null || sessionStorage.getItem('fork-spoon-invite-code') !== null;
}

/** S27-01: Get the stored invite code (from URL or sessionStorage) */
export function getStoredInviteCode(): string | null {
  return new URLSearchParams(window.location.search).get('invite') 
    || sessionStorage.getItem('fork-spoon-invite-code');
}

/** S27-01: Clear stored invite code after successful join */
export function clearStoredInviteCode(): void {
  sessionStorage.removeItem('fork-spoon-invite-code');
}

interface InviteHighlightsProps {
  /** Called when highlights are dismissed */
  onComplete: () => void;
  /** Household name they're joining (optional) */
  householdName?: string;
}

/**
 * Brief feature highlights shown after invite-link account creation.
 * Single screen with compact feature list instead of 3-screen tour.
 */
export const InviteHighlights: FC<InviteHighlightsProps> = ({
  onComplete,
  householdName,
}) => {
  const { t } = useTranslation();

  const features = [
    {
      icon: <CalendarDays className="w-8 h-8" style={{ color: 'var(--fs-accent, #D4644E)' }} />,
      titleKey: 'onboarding.invite.feature1Title',
      descKey: 'onboarding.invite.feature1Desc',
    },
    {
      icon: <Import className="w-8 h-8 text-emerald-600" />,
      titleKey: 'onboarding.invite.feature2Title',
      descKey: 'onboarding.invite.feature2Desc',
    },
    {
      icon: <Users className="w-8 h-8" style={{ color: 'var(--fs-accent, #D4644E)' }} />,
      titleKey: 'onboarding.invite.feature3Title',
      descKey: 'onboarding.invite.feature3Desc',
    },
  ];

  const handleContinue = () => {
    markOnboardingComplete();
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col" style={{ backgroundColor: 'var(--fs-bg-base, #FAF8F6)' }}>
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Welcome message */}
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--fs-text-primary, #2D2522)' }}>
            {householdName
              ? t('onboarding.invite.welcomeHousehold', { name: householdName })
              : t('onboarding.invite.welcome')
            }
          </h2>
          <p className="text-base" style={{ color: 'var(--fs-text-secondary, #7A6E66)' }}>
            {t('onboarding.invite.subtitle')}
          </p>
        </div>

        {/* Compact feature list */}
        <div className="w-full max-w-sm space-y-6 mb-10">
          {features.map((feature, i) => (
            <div key={i} className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--fs-bg-card-inner, #FAF6F3)' }}>
                {feature.icon}
              </div>
              <div>
                <h3 className="font-semibold text-sm" style={{ color: 'var(--fs-text-primary, #2D2522)' }}>
                  {t(feature.titleKey)}
                </h3>
                <p className="text-sm mt-0.5" style={{ color: 'var(--fs-text-muted, #7A6E66)' }}>
                  {t(feature.descKey)}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Action button */}
        <button
          onClick={handleContinue}
          className="w-full max-w-sm py-3.5 px-6 rounded-xl font-semibold text-base
                     text-white
                     transition-colors flex items-center justify-center gap-2
                     focus:outline-none focus:ring-2 focus:ring-offset-2
                     min-h-[44px]"
          style={{ backgroundColor: 'var(--fs-accent, #D4644E)' }}
        >
          {t('onboarding.invite.continue')}
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
