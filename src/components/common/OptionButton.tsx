/**
 * OptionButton Component (Sprint 23)
 *
 * Row of mutually exclusive option buttons with amber active state.
 * Replaces the old ThemeToggle and language buttons in Settings.
 *
 * Design Spec V1.6 — Component: Settings Option Buttons
 *
 * Active:   bg #FEF3C7, color #92400E, border #D97706, font-weight 600
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
            className="flex items-center justify-center gap-1.5 transition-all"
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '8px',
              fontSize: '13px',
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: isActive ? 600 : 400,
              backgroundColor: isActive
                ? 'var(--fs-accent-light, #FEF3C7)'
                : 'var(--fs-bg-elevated, #F5F5F4)',
              color: isActive
                ? 'var(--fs-accent-text, #92400E)'
                : 'var(--fs-text-secondary, #57534E)',
              border: `1px solid ${
                isActive
                  ? 'var(--fs-border-accent, #D97706)'
                  : 'var(--fs-border-strong, #D6D3D1)'
              }`,
              cursor: 'pointer',
              transitionProperty: 'all',
              transitionDuration: '150ms',
              transitionTimingFunction: 'ease-out',
              outline: 'none',
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
