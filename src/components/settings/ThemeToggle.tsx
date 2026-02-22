/**
 * ThemeToggle Component (Sprint 20)
 *
 * 3-way toggle: System / Light / Dark
 * Integrates with useTheme hook for preference detection and persistence.
 *
 * Design Spec V1.5 · Implementation Plan Phase 27
 */

import { Sun, Moon, Monitor } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme, type ThemePreference } from '@/hooks/useTheme';

export function ThemeToggle() {
  const { t } = useTranslation();
  const { preference, setTheme } = useTheme();

  const options: { value: ThemePreference; label: string; icon: React.ReactNode }[] = [
    {
      value: 'system',
      label: t('settings.themeSystem'),
      icon: <Monitor className="w-4 h-4" />,
    },
    {
      value: 'light',
      label: t('settings.themeLight'),
      icon: <Sun className="w-4 h-4" />,
    },
    {
      value: 'dark',
      label: t('settings.themeDark'),
      icon: <Moon className="w-4 h-4" />,
    },
  ];

  return (
    <div className="flex gap-2">
      {options.map((opt) => {
        const isActive = preference === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => setTheme(opt.value)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
              isActive
                ? 'border-[var(--fs-border-accent)] text-[var(--fs-accent-text)]'
                  + ' bg-[var(--fs-accent-light)]'
                : 'border-[var(--fs-border-default)] text-[var(--fs-text-secondary)]'
                  + ' bg-[var(--fs-bg-surface)] hover:border-[var(--fs-accent)]'
            }`}
            aria-pressed={isActive}
          >
            {opt.icon}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
