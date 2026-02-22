/**
 * QuickLogButton Component (Sprint 7)
 *
 * One-tap "Cooked today!" button that updates lastCookedDate to today.
 * Shows on RecipeCard and RecipeDetail.
 * Triggers a toast with 5-second undo window.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChefHat, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QuickLogButtonProps {
  recipeId: string;
  onQuickLog: (recipeId: string) => Promise<void>;
  /** Compact mode for RecipeCard (icon only) */
  compact?: boolean;
  className?: string;
}

export function QuickLogButton({ recipeId, onQuickLog, compact, className }: QuickLogButtonProps) {
  const { t } = useTranslation();
  const [justLogged, setJustLogged] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    e.preventDefault();
    
    if (justLogged || loading) return;

    setLoading(true);
    try {
      await onQuickLog(recipeId);
      setJustLogged(true);
      // Reset after 3 seconds
      setTimeout(() => setJustLogged(false), 3000);
    } catch {
      // Error handled by parent
    } finally {
      setLoading(false);
    }
  };

  if (justLogged) {
    return (
      <Button
        size={compact ? 'sm' : 'default'}
        variant="ghost"
        className={`text-green-600 pointer-events-none ${className || ''}`}
        disabled
      >
        <Check className={compact ? 'w-4 h-4' : 'w-4 h-4 mr-1.5'} />
        {!compact && t('recipes.cookedToday')}
      </Button>
    );
  }

  return (
    <Button
      size={compact ? 'sm' : 'default'}
      variant="outline"
      onClick={handleClick}
      disabled={loading}
      className={`hover:bg-green-50 hover:text-green-700 hover:border-green-300 ${className || ''}`}
      title={t('recipes.cookedToday')}
    >
      <ChefHat className={compact ? 'w-4 h-4' : 'w-4 h-4 mr-1.5'} />
      {!compact && t('recipes.cookedToday')}
    </Button>
  );
}
