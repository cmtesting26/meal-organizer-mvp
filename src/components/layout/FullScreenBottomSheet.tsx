/**
 * FullScreenBottomSheet Component (Sprint 16 — S16-02)
 *
 * Full-screen bottom sheet that slides up from bottom on "+" tap.
 *
 * Design Spec V1.4:
 * - Slides up from bottom, bg white, radius-top 20px, shadow level 4
 * - Header: title (H2 Fraunces) + X close button
 * - Animation: 300ms ease-out
 * - Accessible: focus trap, Escape to close, backdrop click to close
 *
 * Uses Radix Dialog primitives for proper a11y (focus trap, portal, overlay).
 *
 * Implementation Plan Phase 23 · Roadmap V1.4 Epic 3
 */

import { type FC, type ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface FullScreenBottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
}

export const FullScreenBottomSheet: FC<FullScreenBottomSheetProps> = ({
  open,
  onOpenChange,
  title,
  children,
}) => {
  const { t } = useTranslation();

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        {/* Backdrop overlay */}
        <Dialog.Overlay
          className="fixed inset-0 z-50 bg-black/40
                     data-[state=open]:animate-in data-[state=closed]:animate-out
                     data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0"
        />

        {/* Sheet content — slides up from bottom */}
        <Dialog.Content
          className="fixed inset-x-0 bottom-0 z-50
                     rounded-t-[20px]
                     max-h-[90vh] overflow-y-auto
                     data-[state=open]:animate-in data-[state=closed]:animate-out
                     data-[state=open]:slide-in-from-bottom-full data-[state=closed]:slide-out-to-bottom-full
                     duration-300 ease-out
                     focus:outline-none"
          style={{
            backgroundColor: 'var(--fs-bg-surface)',
            boxShadow: 'var(--fs-shadow-lg)',
          }}
          aria-describedby={undefined}
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-8 h-1 rounded-full" style={{ backgroundColor: 'var(--fs-border-strong)' }} />
          </div>

          {/* Header with title and close button */}
          <div className="flex items-center justify-between px-6 pb-4 pt-2">
            <Dialog.Title className="text-xl font-bold" style={{ color: 'var(--fs-text-primary)' }}>
              {title}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                className="flex items-center justify-center
                           w-10 h-10 rounded-full
                           transition-colors focus:outline-none
                           focus:ring-2 focus:ring-amber-500"
                style={{ color: 'var(--fs-text-muted)' }}
                aria-label={t('common.close', 'Close')}
              >
                <X className="w-5 h-5" />
              </button>
            </Dialog.Close>
          </div>

          {/* Sheet body */}
          <div className="px-6 pb-8 pb-[calc(2rem+env(safe-area-inset-bottom))]">
            {children}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
