/**
 * OptionButton Component (Sprint 23)
 *
 * Row of mutually exclusive option buttons with terracotta active state.
 * Replaces the old ThemeToggle and language buttons in Settings.
 *
 * Design Spec V1.6 — Component: Settings Option Buttons
 *
 * Active:   bg #FEF0E8, color #B84835, border #D4644E, font-weight 600
 * Inactive: bg #F5F5F4, color #57534E, border #D6D3D1, font-weight 400
 *
 * @module OptionButton
 */

import { type FC, type ReactNode } from 'react';

interface Option {
  key: string;
  label: string;
  icon?: ReactNode;
}

interface OptionButtonProps {
  options: Option[];
  activeKey: string;
  onSelect: (key: string) => void;
}

export const OptionButton: FC<OptionButtonProps> = ({
  options,
  activeKey,
  onSelect,
}) => {
  return (
    <div className="flex" style={{ gap: '8px' }}>
      {options.map((opt) => {
        const isActive = opt.key === activeKey;
        return (
          <button
            key={opt.key}
            onClick={() => onSelect(opt.key)}
            aria-pressed={isActive}
            className="flex items-center justify-center gap-1.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--fs-accent)] focus-visible:ring-offset-1"
            style={{
              flex: 1,
              height: '36px',
              padding: '0 12px',
              borderRadius: '8px',
              fontSize: '12px',
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: isActive ? 600 : 500,
              backgroundColor: isActive
                ? 'var(--fs-accent-light, #FEF0E8)'
                : 'var(--fs-bg-surface, #FFFFFF)',
              color: isActive
                ? 'var(--fs-accent-text, #B84835)'
                : 'var(--fs-text-secondary, #7A6E66)',
              border: `1px solid ${
                isActive
                  ? 'var(--fs-accent-muted, #E8C4B8)'
                  : 'var(--fs-border-default, #C5B5AB)'
              }`,
              cursor: 'pointer',
              transitionProperty: 'all',
              transitionDuration: '150ms',
              transitionTimingFunction: 'ease-out',
            }}
          >
            {opt.icon && <span className="flex items-center">{opt.icon}</span>}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
};

export default OptionButton;
