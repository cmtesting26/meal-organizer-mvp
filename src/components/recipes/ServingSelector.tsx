/**
 * ServingSelector (Sprint 12 — S12-10)
 *
 * A compact +/- stepper for selecting the number of servings.
 * Used on the recipe detail page to scale ingredient quantities.
 *
 * @module ServingSelector
 */

import { Minus, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ServingSelectorProps {
  /** Current serving count */
  servings: number;
  /** Default serving count (shown as label context) */
  defaultServings: number;
  /** Called when servings change */
  onChange: (servings: number) => void;
  /** Minimum servings allowed */
  min?: number;
  /** Maximum servings allowed */
  max?: number;
}

export function ServingSelector({
  servings,
  defaultServings,
  onChange,
  min = 1,
  max = 99,
}: ServingSelectorProps) {
  const { t } = useTranslation();

  const isOriginal = servings === defaultServings;

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs" style={{ color: 'var(--fs-text-muted, #7A6E66)' }}>{t('scaling.servings')}:</span>
      <div
        className="inline-flex items-center bg-white"
        style={{
          height: '36px',
          borderRadius: '10px',
          border: '1px solid var(--fs-border-default, #C5B5AB)',
        }}
      >
        <button
          type="button"
          disabled={servings <= min}
          onClick={() => onChange(Math.max(min, servings - 1))}
          className="flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--fs-accent)] rounded-l-[9px]"
          style={{ width: '36px', height: '100%', color: 'var(--fs-text-muted, #7A6E66)' }}
          aria-label={t('scaling.decrease')}
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <div style={{ width: '1px', height: '100%', backgroundColor: 'var(--fs-border-default, #C5B5AB)' }} />
        <span
          className={`text-sm font-semibold tabular-nums text-center ${
            isOriginal ? '' : 'text-green-700'
          }`}
          style={{
            width: '48px',
            ...(isOriginal ? { color: 'var(--fs-text-primary, #2D2522)' } : {}),
          }}
        >
          {servings}
        </span>
        <div style={{ width: '1px', height: '100%', backgroundColor: 'var(--fs-border-default, #C5B5AB)' }} />
        <button
          type="button"
          disabled={servings >= max}
          onClick={() => onChange(Math.min(max, servings + 1))}
          className="flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--fs-accent)] rounded-r-[9px]"
          style={{ width: '36px', height: '100%', color: 'var(--fs-text-muted, #7A6E66)' }}
          aria-label={t('scaling.increase')}
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
      {!isOriginal && (
        <button
          type="button"
          onClick={() => onChange(defaultServings)}
          className="text-xs text-green-600 hover:text-green-800 underline transition-colors"
        >
          {t('scaling.reset')}
        </button>
      )}
    </div>
  );
}
