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
        borderBottom: '1px solid var(--fs-border-default, #E7E5E4)',
        gap: '24px',
      }}
    >
      {tabs.map((tab) => {
        const isActive = tab.key === activeTab;
        return (
          <button
            key={tab.key}
            role="tab"
            aria-selected={isActive}
            onClick={() => onTabChange(tab.key)}
            className="bg-transparent border-none cursor-pointer relative"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: `${fontSize}px`,
              fontWeight: isActive ? 600 : 400,
              color: isActive
                ? 'var(--fs-text-primary, #1C1917)'
                : 'var(--fs-text-muted, #78716C)',
              padding: '8px 0',
              borderBottom: `2px solid ${isActive ? '#D97706' : 'transparent'}`,
              marginBottom: '-1px',
              transition: 'all 200ms ease-in-out',
              outline: 'none',
            }}
            onKeyDown={(e) => {
              // Keyboard navigation: arrow keys move between tabs
              const idx = tabs.findIndex((t) => t.key === tab.key);
              if (e.key === 'ArrowRight' && idx < tabs.length - 1) {
                e.preventDefault();
                onTabChange(tabs[idx + 1].key);
              }
              if (e.key === 'ArrowLeft' && idx > 0) {
                e.preventDefault();
                onTabChange(tabs[idx - 1].key);
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
