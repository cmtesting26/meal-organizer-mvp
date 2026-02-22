/**
 * TagFilterChips Component (Sprint 23 update)
 *
 * Horizontal scrollable row of tag filter chips.
 * Sprint 23: Updated from blue to warm stone/amber palette (Design Spec V1.6).
 *
 * Default: bg #F5F5F4, text #57534E, border #E7E5E4 (warm stone)
 * Active:  bg #FEF3C7, text #92400E, border #D97706 (amber)
 */

import { useTranslation } from 'react-i18next';

interface TagFilterChipsProps {
  availableTags: string[];
  selectedTag: string | null;
  onSelectTag: (tag: string | null) => void;
}

export function TagFilterChips({ availableTags, selectedTag, onSelectTag }: TagFilterChipsProps) {
  const { t } = useTranslation();

  if (availableTags.length === 0) return null;

  return (
    <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]" role="group" aria-label={t('tags.filterByTag')}>
      {/* "All" chip */}
      <button
        onClick={() => onSelectTag(null)}
        className="shrink-0 rounded-full text-xs font-medium transition-colors"
        style={{
          padding: '4px 12px',
          backgroundColor: selectedTag === null
            ? 'var(--fs-accent-light, #FEF3C7)'
            : 'var(--fs-bg-elevated, #F5F5F4)',
          color: selectedTag === null
            ? 'var(--fs-accent-text, #92400E)'
            : 'var(--fs-text-secondary, #57534E)',
          border: `1px solid ${selectedTag === null
            ? 'var(--fs-border-accent, #D97706)'
            : 'var(--fs-border-default, #E7E5E4)'}`,
        }}
      >
        {t('tags.allRecipes')}
      </button>

      {/* Tag chips — Design Spec V1.6: warm stone/amber palette */}
      {availableTags.map(tag => (
        <button
          key={tag}
          onClick={() => onSelectTag(selectedTag === tag ? null : tag)}
          className="shrink-0 rounded-full text-xs font-medium transition-colors"
          style={{
            padding: '4px 12px',
            backgroundColor: selectedTag === tag
              ? 'var(--fs-accent-light, #FEF3C7)'
              : 'var(--fs-bg-elevated, #F5F5F4)',
            color: selectedTag === tag
              ? 'var(--fs-accent-text, #92400E)'
              : 'var(--fs-text-secondary, #57534E)',
            border: `1px solid ${selectedTag === tag
              ? 'var(--fs-border-accent, #D97706)'
              : 'var(--fs-border-default, #E7E5E4)'}`,
          }}
        >
          {tag}
        </button>
      ))}
    </div>
  );
}
