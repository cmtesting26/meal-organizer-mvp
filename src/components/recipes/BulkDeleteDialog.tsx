/**
 * BulkDeleteDialog Component (Sprint 8)
 *
 * Confirmation dialog for bulk deleting multiple recipes.
 */

import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

interface BulkDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  onConfirm: () => void;
}

export function BulkDeleteDialog({ open, onOpenChange, selectedCount, onConfirm }: BulkDeleteDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-red-500" />
            {t('bulk.deleteTitle')}
          </DialogTitle>
          <DialogDescription>
            {t('bulk.deleteDescription', { count: selectedCount })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('delete.cancel')}
          </Button>
          <Button
            variant="destructive"
            onClick={() => { onConfirm(); onOpenChange(false); }}
          >
            {t('bulk.deleteConfirm', { count: selectedCount })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
