/**
 * BulkTagDialog Component (Sprint 8)
 *
 * Dialog for assigning a tag to multiple selected recipes at once.
 * Shows existing tags to pick from + input for new tag.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface BulkTagDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingTags: string[];
  selectedCount: number;
  onAssignTag: (tag: string) => void;
}

export function BulkTagDialog({
  open,
  onOpenChange,
  existingTags,
  selectedCount,
  onAssignTag,
}: BulkTagDialogProps) {
  const { t } = useTranslation();
  const [newTag, setNewTag] = useState('');

  const handleSubmit = () => {
    const tag = newTag.trim();
    if (tag) {
      onAssignTag(tag);
      setNewTag('');
      onOpenChange(false);
    }
  };

  const handleExistingTagClick = (tag: string) => {
    onAssignTag(tag);
    setNewTag('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('bulk.assignTagTitle')}</DialogTitle>
          <DialogDescription>
            {t('bulk.assignTagDescription', { count: selectedCount })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Existing tags to quickly pick */}
          {existingTags.length > 0 && (
            <div>
              <p className="text-sm text-gray-500 mb-2">{t('bulk.existingTags')}</p>
              <div className="flex flex-wrap gap-2">
                {existingTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="cursor-pointer hover:bg-primary/10 hover:border-primary transition-colors px-3 py-1"
                    onClick={() => handleExistingTagClick(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* New tag input */}
          <div>
            <p className="text-sm text-gray-500 mb-2">{t('bulk.orNewTag')}</p>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTag(e.target.value)}
                placeholder={t('bulk.newTagPlaceholder')}
                onKeyDown={(e: React.KeyboardEvent) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                className="flex-1"
                autoFocus
              />
              <Button onClick={handleSubmit} disabled={!newTag.trim()}>
                {t('bulk.apply')}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
