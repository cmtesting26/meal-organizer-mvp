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
      <span className="text-xs text-gray-500">{t('scaling.servings')}:</span>
      <div className="inline-flex items-center rounded-lg border bg-white">
        <button
          type="button"
          disabled={servings <= min}
          onClick={() => onChange(Math.max(min, servings - 1))}
          className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-l-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label={t('scaling.decrease')}
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <span
          className={`px-3 py-1 text-sm font-semibold tabular-nums min-w-[2.5rem] text-center ${
            isOriginal ? 'text-gray-900' : 'text-green-700'
          }`}
        >
          {servings}
        </span>
        <button
          type="button"
          disabled={servings >= max}
          onClick={() => onChange(Math.min(max, servings + 1))}
          className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-r-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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
