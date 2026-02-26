/**
 * TextTabs Component (Sprint 23)
 *
 * Horizontal text tabs with amber underline indicator.
 * Replaces the old SegmentedControl pill-style component.
 *
 * Design Spec V1.6 — Component: Library Text Tabs, Recipe Detail tabs
 *
 * Usage:
 *   <TextTabs
 *     tabs={[{ key: 'all', label: 'All Recipes' }, { key: 'mostCooked', label: 'Most Cooked' }]}
 *     activeTab="all"
 *     onTabChange={(key) => setActive(key)}
 *   />
 *
 * @module TextTabs
 */

import { type FC } from 'react';

interface Tab {
  key: string;
  label: string;
}

interface TextTabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (key: string) => void;
  /** Optional font size override (default 14) */
  fontSize?: number;
}

export const TextTabs: FC<TextTabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
  fontSize = 14,
}) => {
  return (
    <div
      role="tablist"
      className="flex"
      style={{
        gap: '24px',
        boxShadow: 'inset 0 -1px 0 0 var(--fs-border-default, #C5B5AB)',
      }}
    >
      {tabs.map((tab) => {
        const isActive = tab.key === activeTab;
        return (
          <button
            key={tab.key}
            id={`tab-${tab.key}`}
            role="tab"
            aria-selected={isActive}
            aria-controls={`panel-${tab.key}`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onTabChange(tab.key)}
            className="bg-transparent border-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--fs-accent)] focus-visible:ring-offset-1"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: `${fontSize}px`,
              fontWeight: isActive ? 600 : 500,
              color: isActive
                ? 'var(--fs-text-primary, #2D2522)'
                : 'var(--fs-text-muted, #7A6E66)',
              padding: '10px 0',
              borderBottom: `2px solid ${isActive ? 'var(--fs-accent, #D4644E)' : 'transparent'}`,
              transition: 'all 200ms ease-in-out',
            }}
            onKeyDown={(e) => {
              // Keyboard navigation: arrow keys move between tabs
              const idx = tabs.findIndex((t) => t.key === tab.key);
              let nextKey: string | null = null;
              if (e.key === 'ArrowRight' && idx < tabs.length - 1) {
                e.preventDefault();
                nextKey = tabs[idx + 1].key;
              }
              if (e.key === 'ArrowLeft' && idx > 0) {
                e.preventDefault();
                nextKey = tabs[idx - 1].key;
              }
              if (nextKey) {
                onTabChange(nextKey);
                const nextEl = document.getElementById(`tab-${nextKey}`);
                nextEl?.focus();
              }
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};

export default TextTabs;
