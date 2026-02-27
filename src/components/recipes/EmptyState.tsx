/**
 * EmptyState Component (Sprint 7 — i18n)
 */

import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { PlusCircle, Link } from 'lucide-react';

interface EmptyStateProps {
  onImportClick: () => void;
  onManualAddClick: () => void;
}

export function EmptyState({ onImportClick, onManualAddClick }: EmptyStateProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
      <div
        className="w-24 h-24 mb-6 rounded-full flex items-center justify-center"
        style={{ backgroundColor: 'var(--fs-bg-elevated, #F5F5F4)' }}
      >
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"
          style={{ color: 'var(--fs-text-placeholder, #A8A29E)' }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--fs-text-primary, #2D2522)' }}>
        {t('emptyState.title')}
      </h2>
      <p className="mb-8 max-w-md" style={{ color: 'var(--fs-text-secondary, #7A6E66)' }}>
        {t('emptyState.description')}
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <Button onClick={onImportClick} size="lg" className="min-w-[160px]"
          style={{ backgroundColor: 'var(--fs-accent, #D4644E)', color: 'var(--fs-text-inverse, #FFFFFF)' }}>
          <Link className="w-4 h-4 mr-2" />
          {t('emptyState.importButton')}
        </Button>
        <Button onClick={onManualAddClick} variant="outline" size="lg" className="min-w-[160px]">
          <PlusCircle className="w-4 h-4 mr-2" />
          {t('emptyState.manualButton')}
        </Button>
      </div>
      <p className="text-sm mt-8" style={{ color: 'var(--fs-text-muted, #7A6E66)' }}>
        {t('emptyState.tip')} ✨
      </p>
    </div>
  );
}
