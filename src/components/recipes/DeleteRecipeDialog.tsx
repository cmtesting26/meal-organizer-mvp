/**
 * DeleteRecipeDialog Component (Sprint 7 — i18n)
 */

import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

interface DeleteRecipeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipeName: string;
  onConfirm: () => void;
}

export function DeleteRecipeDialog({ open, onOpenChange, recipeName, onConfirm }: DeleteRecipeDialogProps) {
  const { t } = useTranslation();
  const handleDelete = () => { onConfirm(); onOpenChange(false); };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('delete.title')}</DialogTitle>
          <DialogDescription>{t('delete.description', { name: recipeName })}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('delete.cancel')}</Button>
          <Button variant="destructive" onClick={handleDelete} className="gap-2">
            <Trash2 className="w-4 h-4" />{t('delete.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
