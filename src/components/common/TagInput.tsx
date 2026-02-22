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
      className="flex flex-wrap gap-1.5 p-2 border rounded-md bg-white focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 min-h-[42px] cursor-text"
      onClick={() => inputRef.current?.focus()}
    >
      {tags.map(tag => (
        <Badge
          key={tag}
          className="gap-1 px-2 py-0.5 text-xs"
          style={{
            backgroundColor: 'var(--fs-bg-elevated, #F5F5F4)',
            color: 'var(--fs-text-secondary, #57534E)',
            borderColor: 'var(--fs-border-default, #E7E5E4)',
          }}
        >
          {tag}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              removeTag(tag);
            }}
            className="ml-0.5"
            style={{ color: 'var(--fs-text-muted, #78716C)' }}
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
