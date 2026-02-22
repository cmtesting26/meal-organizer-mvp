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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
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
        className="rounded-t-[16px] pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]"
      >
        <SheetHeader className="pb-1">
          <SheetTitle>{t('ocr.title', 'Import from Photo')}</SheetTitle>
          <SheetDescription className="text-xs">{t('ocr.chooseSource', 'Take a photo of a cookbook page or upload an existing image.')}</SheetDescription>
        </SheetHeader>

        {/* PhotoCapture content */}
        <div className="mt-2">
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
