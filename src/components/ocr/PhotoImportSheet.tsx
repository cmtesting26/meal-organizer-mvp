/**
 * PhotoImportSheet Component (Sprint 24 — S24-03)
 *
 * Wraps the PhotoCapture component in a slide-up bottom sheet.
 * Uses the same Sheet (Radix) primitive as ImportSheet for consistency,
 * which guarantees bottom-pinned positioning on mobile.
 *
 * Design Specification V1.6 — Import Flow UX Improvements
 */

import { type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { X } from 'lucide-react';
import { PhotoCapture, type PhotoCaptureResult } from '@/components/ocr/PhotoCapture';

interface PhotoImportSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (result: PhotoCaptureResult) => void;
}

export const PhotoImportSheet: FC<PhotoImportSheetProps> = ({
  open,
  onOpenChange,
  onComplete,
}) => {
  const { t } = useTranslation();

  const handleComplete = (result: PhotoCaptureResult) => {
    onComplete(result);
    onOpenChange(false);
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="!p-0 !gap-0 rounded-t-[20px] [&>button.absolute]:hidden"
        style={{ backgroundColor: '#FFFFFF' }}
      >
        {/* DragHandle — padding: [12, 0, 4, 0] */}
        <div className="flex justify-center" style={{ padding: '12px 0 4px 0' }}>
          <div style={{ width: 32, height: 4, borderRadius: 9999, backgroundColor: '#E8DDD8' }} />
        </div>

        {/* SheetHeader — padding: [8, 24, 12, 24] */}
        <div className="flex items-center justify-between" style={{ padding: '8px 24px 12px 24px' }}>
          <h2
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 18,
              fontWeight: 600,
              lineHeight: 1,
              color: 'var(--fs-text-primary, #2D2522)',
            }}
          >
            {t('ocr.title', 'Import from Photo')}
          </h2>
          <button
            onClick={() => onOpenChange(false)}
            className="flex items-center justify-center rounded-full hover:bg-[var(--fs-hover-bg)] transition-colors"
            style={{ width: 44, height: 44 }}
            aria-label={t('common.close', 'Close')}
          >
            <X style={{ width: 20, height: 20, color: 'var(--fs-text-secondary, #7A6E66)' }} />
          </button>
        </div>

        {/* SheetBody — padding: [4, 24, 32, 24], gap: 16 */}
        <div style={{ padding: '4px 24px 32px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Description */}
          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14,
              fontWeight: 400,
              color: 'var(--fs-text-secondary, #7A6E66)',
            }}
          >
            {t('ocr.chooseSource', 'Take a photo or upload an existing image.')}
          </p>

          {/* PhotoCapture content */}
          <PhotoCapture
            onComplete={handleComplete}
            onClose={handleClose}
            embedded
          />
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default PhotoImportSheet;
