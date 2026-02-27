/**
 * AddRecipeSheet Component (Sprint 16 — S16-03)
 *
 * Content for the full-screen bottom sheet "Add Recipe" — 4 import options.
 *
 * Design Spec V1.4:
 * - 4 import option cards in vertical layout
 * - Each card: amber icon container (48×48, bg-amber-100, rounded-xl) + title + description
 * - Icons 32px: Globe (website), Share2 (Instagram/TikTok), Camera (scan), PenLine (manual)
 *
 * Implementation Plan Phase 23 · Roadmap V1.4 Epic 3
 */

import { type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Instagram, Camera, PenLine } from 'lucide-react';
import { FullScreenBottomSheet } from '@/components/layout/FullScreenBottomSheet';

interface AddRecipeSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onWebsiteImport: () => void;
  onSocialImport: () => void;
  onScanImport: () => void;
  onManualAdd: () => void;
}

interface ImportOptionProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}

const ImportOption: FC<ImportOptionProps> = ({ icon, title, description, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 p-4 rounded-[14px]
                 transition-colors text-left
                 focus:outline-none focus:ring-2 focus:ring-offset-1"
      style={{ backgroundColor: 'transparent', '--tw-ring-color': 'var(--fs-accent, #D4644E)' } as React.CSSProperties}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--fs-bg-elevated, #F5F5F4)')}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
    >
      <div
        className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
        style={{ backgroundColor: 'var(--fs-accent-light, #FEF0E8)', color: 'var(--fs-accent, #D4644E)' }}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1 flex flex-col gap-0.5">
        <p className="font-semibold" style={{ fontSize: 15, color: 'var(--fs-text-primary, #2D2522)' }}>{title}</p>
        <p style={{ fontSize: 13, color: 'var(--fs-text-muted, #7A6E66)' }}>{description}</p>
      </div>
    </button>
  );
};

export function AddRecipeSheet({
  open,
  onOpenChange,
  onWebsiteImport,
  onSocialImport,
  onScanImport,
  onManualAdd,
}: AddRecipeSheetProps) {
  const { t } = useTranslation();

  const handleOption = (handler: () => void) => {
    onOpenChange(false);
    handler();
  };

  return (
    <FullScreenBottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title={t('addRecipeSheet.title', 'Add Recipe')}
    >
      <div className="space-y-1">
        <ImportOption
          icon={<Globe className="w-6 h-6" />}
          title={t('addRecipeSheet.website', 'Import from Website')}
          description={t('addRecipeSheet.websiteDesc', 'Paste a recipe URL to auto-import')}
          onClick={() => handleOption(onWebsiteImport)}
        />
        <ImportOption
          icon={<Instagram className="w-6 h-6" />}
          title={t('addRecipeSheet.social', 'Instagram / TikTok')}
          description={t('addRecipeSheet.socialDesc', 'Import from a social media post')}
          onClick={() => handleOption(onSocialImport)}
        />
        <ImportOption
          icon={<Camera className="w-6 h-6" />}
          title={t('addRecipeSheet.scan', 'Scan Cookbook')}
          description={t('addRecipeSheet.scanDesc', 'Take a photo of a recipe page')}
          onClick={() => handleOption(onScanImport)}
        />
        <ImportOption
          icon={<PenLine className="w-6 h-6" />}
          title={t('addRecipeSheet.manual', 'Add Manually')}
          description={t('addRecipeSheet.manualDesc', 'Type in a new recipe from scratch')}
          onClick={() => handleOption(onManualAdd)}
        />
      </div>
    </FullScreenBottomSheet>
  );
}
