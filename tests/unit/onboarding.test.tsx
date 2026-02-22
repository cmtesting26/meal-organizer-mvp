/**
 * Onboarding Tests (Sprint 17 — S17-13)
 *
 * Tests onboarding flow for:
 * - First launch: shows 3-screen onboarding
 * - Repeat visit: skips onboarding (localStorage flag)
 * - Skip button: marks complete and dismisses
 * - Next/Get Started navigation through all screens
 * - Invite-link path: shows condensed highlights
 * - i18n: all strings use translation keys
 * - Accessibility: keyboard navigation, ARIA attributes
 *
 * Design Spec V1.4 Flows 12-13
 * Implementation Plan Phase 24
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../src/i18n';
import { OnboardingScreen, type OnboardingSlide } from '../../src/components/onboarding/OnboardingScreen';
import {
  OnboardingFlow,
  isOnboardingComplete,
  markOnboardingComplete,
} from '../../src/components/onboarding/OnboardingFlow';
import {
  InviteHighlights,
} from '../../src/components/onboarding/OnboardingInvitePath';

// Wrapper for i18n
function Wrapper({ children }: { children: React.ReactNode }) {
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}

describe('OnboardingScreen', () => {
  const mockSlide: OnboardingSlide = {
    id: 'test',
    icon: <div data-testid="test-icon">Icon</div>,
    titleKey: 'onboarding.screen1.title',
    descriptionKey: 'onboarding.screen1.description',
  };

  it('renders slide content', () => {
    render(
      <Wrapper>
        <OnboardingScreen
          slide={mockSlide}
          currentIndex={0}
          totalSlides={3}
          onNext={vi.fn()}
          onSkip={vi.fn()}
          isLastSlide={false}
        />
      </Wrapper>
    );

    expect(screen.getByText('Plan Your Week')).toBeInTheDocument();
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });

  it('renders pagination dots matching totalSlides', () => {
    render(
      <Wrapper>
        <OnboardingScreen
          slide={mockSlide}
          currentIndex={1}
          totalSlides={3}
          onNext={vi.fn()}
          onSkip={vi.fn()}
          isLastSlide={false}
        />
      </Wrapper>
    );

    const dots = screen.getAllByRole('tab');
    expect(dots).toHaveLength(3);
    // Second dot should be selected
    expect(dots[1]).toHaveAttribute('aria-selected', 'true');
    expect(dots[0]).toHaveAttribute('aria-selected', 'false');
  });

  it('shows "Next" button on non-last slides', () => {
    render(
      <Wrapper>
        <OnboardingScreen
          slide={mockSlide}
          currentIndex={0}
          totalSlides={3}
          onNext={vi.fn()}
          onSkip={vi.fn()}
          isLastSlide={false}
        />
      </Wrapper>
    );

    expect(screen.getByText('Next')).toBeInTheDocument();
  });

  it('shows "Get Started" button on last slide', () => {
    render(
      <Wrapper>
        <OnboardingScreen
          slide={mockSlide}
          currentIndex={2}
          totalSlides={3}
          onNext={vi.fn()}
          onSkip={vi.fn()}
          isLastSlide={true}
        />
      </Wrapper>
    );

    expect(screen.getByText('Get Started')).toBeInTheDocument();
  });

  it('calls onSkip when skip button clicked', () => {
    const onSkip = vi.fn();
    render(
      <Wrapper>
        <OnboardingScreen
          slide={mockSlide}
          currentIndex={0}
          totalSlides={3}
          onNext={vi.fn()}
          onSkip={onSkip}
          isLastSlide={false}
        />
      </Wrapper>
    );

    fireEvent.click(screen.getByText('Skip'));
    expect(onSkip).toHaveBeenCalledTimes(1);
  });

  it('calls onNext when action button clicked', () => {
    const onNext = vi.fn();
    render(
      <Wrapper>
        <OnboardingScreen
          slide={mockSlide}
          currentIndex={0}
          totalSlides={3}
          onNext={onNext}
          onSkip={vi.fn()}
          isLastSlide={false}
        />
      </Wrapper>
    );

    fireEvent.click(screen.getByText('Next'));
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it('has accessible skip button with aria-label', () => {
    render(
      <Wrapper>
        <OnboardingScreen
          slide={mockSlide}
          currentIndex={0}
          totalSlides={3}
          onNext={vi.fn()}
          onSkip={vi.fn()}
          isLastSlide={false}
        />
      </Wrapper>
    );

    const skipButton = screen.getByLabelText('Skip');
    expect(skipButton).toBeInTheDocument();
  });
});

describe('OnboardingFlow', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('starts on slide 1 (scheduling)', () => {
    render(
      <Wrapper>
        <OnboardingFlow onComplete={vi.fn()} />
      </Wrapper>
    );

    expect(screen.getByText('Plan Your Week')).toBeInTheDocument();
  });

  it('navigates through all 3 slides on Next clicks', () => {
    render(
      <Wrapper>
        <OnboardingFlow onComplete={vi.fn()} />
      </Wrapper>
    );

    // Screen 1
    expect(screen.getByText('Plan Your Week')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Next'));

    // Screen 2
    expect(screen.getByText('Import Any Recipe')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Next'));

    // Screen 3
    expect(screen.getByText('Cook Together')).toBeInTheDocument();
    expect(screen.getByText('Get Started')).toBeInTheDocument();
  });

  it('calls onComplete and sets localStorage when Get Started clicked', () => {
    const onComplete = vi.fn();
    render(
      <Wrapper>
        <OnboardingFlow onComplete={onComplete} />
      </Wrapper>
    );

    // Navigate to last slide
    fireEvent.click(screen.getByText('Next'));
    fireEvent.click(screen.getByText('Next'));
    fireEvent.click(screen.getByText('Get Started'));

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem('fork-spoon-onboarding-complete')).toBe('true');
  });

  it('calls onComplete and sets localStorage when Skip clicked', () => {
    const onComplete = vi.fn();
    render(
      <Wrapper>
        <OnboardingFlow onComplete={onComplete} />
      </Wrapper>
    );

    fireEvent.click(screen.getByText('Skip'));

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem('fork-spoon-onboarding-complete')).toBe('true');
  });
});

describe('isOnboardingComplete', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns false when flag not set', () => {
    expect(isOnboardingComplete()).toBe(false);
  });

  it('returns true when flag is set', () => {
    markOnboardingComplete();
    expect(isOnboardingComplete()).toBe(true);
  });
});

describe('InviteHighlights', () => {
  it('renders welcome message', () => {
    render(
      <Wrapper>
        <InviteHighlights onComplete={vi.fn()} />
      </Wrapper>
    );

    expect(screen.getByText('Welcome to Fork and Spoon!')).toBeInTheDocument();
  });

  it('renders household name when provided', () => {
    render(
      <Wrapper>
        <InviteHighlights onComplete={vi.fn()} householdName="Sarah" />
      </Wrapper>
    );

    expect(screen.getByText("Welcome to Sarah's kitchen!")).toBeInTheDocument();
  });

  it('renders all 3 feature highlights', () => {
    render(
      <Wrapper>
        <InviteHighlights onComplete={vi.fn()} />
      </Wrapper>
    );

    expect(screen.getByText('Weekly Schedule')).toBeInTheDocument();
    expect(screen.getByText('Recipe Library')).toBeInTheDocument();
    expect(screen.getByText('Shared Household')).toBeInTheDocument();
  });

  it('calls onComplete and sets localStorage when continue clicked', () => {
    const onComplete = vi.fn();
    localStorage.clear();

    render(
      <Wrapper>
        <InviteHighlights onComplete={onComplete} />
      </Wrapper>
    );

    fireEvent.click(screen.getByText("Let's Go"));

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem('fork-spoon-onboarding-complete')).toBe('true');
  });
});
