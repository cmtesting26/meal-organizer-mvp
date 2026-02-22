/**
 * EditDateDialog Component (Sprint 7 — i18n)
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CalendarDays } from 'lucide-react';

interface EditDateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentDate?: string;
  onSave: (date: string | undefined) => void;
}

export function EditDateDialog({ open, onOpenChange, currentDate, onSave }: EditDateDialogProps) {
  const { t } = useTranslation();
  const [dateValue, setDateValue] = useState('');

  useEffect(() => {
    if (currentDate) {
      setDateValue(currentDate.split('T')[0]);
    } else {
      setDateValue(new Date().toISOString().split('T')[0]);
    }
  }, [currentDate, open]);

  const handleSave = () => {
    if (dateValue) onSave(new Date(dateValue).toISOString());
    onOpenChange(false);
  };

  const handleClear = () => { onSave(undefined); onOpenChange(false); };

  const handleMarkToday = () => { onSave(new Date().toISOString()); onOpenChange(false); };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5" />{t('editDate.title')}
          </DialogTitle>
          <DialogDescription>{t('editDate.description')}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="cook-date">{t('editDate.label')}</Label>
            <Input id="cook-date" type="date" value={dateValue}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDateValue(e.target.value)}
              max={new Date().toISOString().split('T')[0]} />
          </div>
          <Button type="button" variant="outline" onClick={handleMarkToday} className="w-full">
            <CalendarDays className="w-4 h-4 mr-2" />{t('editDate.markToday')}
          </Button>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          {currentDate && (
            <Button variant="ghost" onClick={handleClear}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 mr-auto">
              {t('editDate.clear')}
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('editDate.cancel')}</Button>
          <Button onClick={handleSave}>{t('editDate.save')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
