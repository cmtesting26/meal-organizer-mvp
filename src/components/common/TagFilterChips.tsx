/**
 * TagFilterChips Component (D3 update)
 *
 * Horizontal scrollable row of tag filter chips.
 * D3: Cream & Nordic / Terracotta palette.
 *
 * Default: bg white, text #7A6E66, border #C5B5AB
 * Active:  bg #FEF0E8, text #B84835, border #E8C4B8 (terracotta)
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
        className="shrink-0 rounded-full text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--fs-accent)] focus-visible:ring-offset-1"
        style={{
          padding: '8px 16px',
          fontWeight: selectedTag === null ? 600 : 500,
          backgroundColor: selectedTag === null
            ? 'var(--fs-filter-active-bg, #FEF0E8)'
            : 'var(--fs-bg-surface, #FFFFFF)',
          color: selectedTag === null
            ? 'var(--fs-accent-text, #B84835)'
            : 'var(--fs-text-secondary, #44403C)',
          border: `1px solid ${selectedTag === null
            ? 'var(--fs-filter-active-border, #E8C4B8)'
            : 'var(--fs-border-default, #C5B5AB)'}`,
        }}
      >
        {t('tags.allRecipes')}
      </button>

      {/* Tag chips — Design Spec V1.6: warm stone/amber palette */}
      {availableTags.map(tag => (
        <button
          key={tag}
          onClick={() => onSelectTag(selectedTag === tag ? null : tag)}
          className="shrink-0 rounded-full text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--fs-accent)] focus-visible:ring-offset-1"
          style={{
            padding: '8px 16px',
            fontWeight: selectedTag === tag ? 600 : 500,
            backgroundColor: selectedTag === tag
              ? 'var(--fs-filter-active-bg, #FEF0E8)'
              : 'var(--fs-bg-surface, #FFFFFF)',
            color: selectedTag === tag
              ? 'var(--fs-accent-text, #B84835)'
              : 'var(--fs-text-secondary, #44403C)',
            border: `1px solid ${selectedTag === tag
              ? 'var(--fs-filter-active-border, #E8C4B8)'
              : 'var(--fs-border-default, #C5B5AB)'}`,
          }}
        >
          {tag}
        </button>
      ))}
    </div>
  );
}
