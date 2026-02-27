/**
 * BulkActionBar Component (Sprint 8)
 *
 * Floating action bar displayed when recipes are selected in multi-select mode.
 * Provides bulk delete and bulk assign tag actions.
 */

import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Trash2, Tag, X } from 'lucide-react';

interface BulkActionBarProps {
  selectedCount: number;
  onBulkDelete: () => void;
  onBulkTag: () => void;
  onClearSelection: () => void;
}

export function BulkActionBar({ selectedCount, onBulkDelete, onBulkTag, onClearSelection }: BulkActionBarProps) {
  const { t } = useTranslation();

  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-20 left-0 right-0 z-50 flex justify-center px-4 animate-in slide-in-from-bottom-4">
      <div className="text-white rounded-full shadow-lg px-4 py-2 flex items-center gap-3 max-w-md" style={{ backgroundColor: 'var(--fs-toast-bg, #1C1917)' }}>
        <span className="text-sm font-medium whitespace-nowrap">
          {t('bulk.selected', { count: selectedCount })}
        </span>

        <div className="h-4 w-px" style={{ backgroundColor: 'var(--fs-toast-divider, #57534E)' }} />

        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:bg-stone-700 h-8 px-3 gap-1.5"
          onClick={onBulkTag}
        >
          <Tag className="w-4 h-4" />
          <span className="text-sm">{t('bulk.assignTag')}</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="text-red-400 hover:bg-red-500/20 hover:text-red-300 h-8 px-3 gap-1.5"
          onClick={onBulkDelete}
        >
          <Trash2 className="w-4 h-4" />
          <span className="text-sm">{t('bulk.delete')}</span>
        </Button>

        <div className="h-4 w-px" style={{ backgroundColor: 'var(--fs-toast-divider, #57534E)' }} />

        <Button
          variant="ghost"
          size="sm"
          className="hover:bg-stone-700 hover:text-white h-8 w-8 p-0 min-w-[44px] min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--fs-accent)] focus-visible:ring-offset-1"
          style={{ color: 'var(--fs-text-muted, #7A6E66)' }}
          onClick={onClearSelection}
          aria-label={t('bulk.clearSelection')}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
