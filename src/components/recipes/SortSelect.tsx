/**
 * SortSelect Component (Sprint 7 — i18n)
 */

import { useTranslation } from 'react-i18next';
import { ArrowUpDown } from 'lucide-react';

export type SortOption = 'oldest' | 'newest' | 'az';

interface SortSelectProps {
  value: SortOption;
  onChange: (value: SortOption) => void;
}

export function SortSelect({ value, onChange }: SortSelectProps) {
  const { t } = useTranslation();

  const sortLabels: Record<SortOption, string> = {
    oldest: t('sort.oldestFirst'),
    newest: t('sort.newestFirst'),
    az: t('sort.alphabetical'),
  };

  return (
    <div className="flex items-center gap-2">
      <ArrowUpDown className="w-4 h-4 text-gray-400" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as SortOption)}
        className="text-sm text-gray-600 bg-transparent border-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 rounded px-1 py-0.5"
        aria-label="Sort recipes by"
      >
        {(Object.keys(sortLabels) as SortOption[]).map((option) => (
          <option key={option} value={option}>{sortLabels[option]}</option>
        ))}
      </select>
    </div>
  );
}
