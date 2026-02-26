/**
 * TagInput Component (Sprint 7)
 *
 * Freeform tag input for RecipeForm.
 * Add tags by typing and pressing Enter or comma.
 * Remove tags by clicking the X button.
 */

import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}

export function TagInput({ tags, onChange, placeholder }: TagInputProps) {
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    const capitalized = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
    if (capitalized && !tags.includes(capitalized)) {
      onChange([...tags, capitalized]);
    }
    setInputValue('');
  };

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter(t => t !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (inputValue.trim()) {
        addTag(inputValue);
      }
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  const handleBlur = () => {
    if (inputValue.trim()) {
      addTag(inputValue);
    }
  };

  return (
    <div
      className="flex flex-wrap items-center gap-1.5 cursor-text outline-none focus-within:ring-2 focus-within:ring-[var(--fs-accent)]"
      style={{
        minHeight: 44,
        borderRadius: 12,
        border: '1px solid var(--fs-input-border, #C5B5AB)',
        backgroundColor: 'var(--fs-input-bg, #FFFFFF)',
        padding: '6px 14px',
      }}
      onClick={() => inputRef.current?.focus()}
    >
      {tags.map(tag => (
        <Badge
          key={tag}
          className="gap-1 px-2 py-0.5 text-xs"
          style={{
            backgroundColor: 'var(--fs-bg-elevated, #F5F5F4)',
            color: 'var(--fs-text-secondary, #7A6E66)',
            borderColor: 'var(--fs-border-default, #C5B5AB)',
          }}
        >
          {tag}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              removeTag(tag);
            }}
            className="ml-0.5 p-1.5 -mr-1 flex items-center justify-center rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--fs-accent)] focus-visible:ring-offset-1"
            style={{ color: 'var(--fs-text-muted, #7A6E66)' }}
            aria-label={t('tags.removeTag', { tag })}
          >
            <X className="w-3 h-3" />
          </button>
        </Badge>
      ))}
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder={tags.length === 0 ? (placeholder || t('recipeForm.tagsPlaceholder')) : ''}
        className="flex-1 min-w-[100px] outline-none bg-transparent text-sm"
      />
    </div>
  );
}
