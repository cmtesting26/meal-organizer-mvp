/**
 * TagFilterChips Tests (Sprint 23 update)
 *
 * Sprint 23: Updated from blue Tailwind classes to warm stone/amber CSS tokens.
 * Design Spec V1.6: warm stone default (#F5F5F4), amber active (#FEF3C7).
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TagFilterChips } from '../../src/components/common/TagFilterChips';

// Mock i18n
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'tags.filterByTag': 'Filter by tag',
        'tags.allRecipes': 'All',
      };
      return map[key] || key;
    },
  }),
}));

const TAGS = ['Italian', 'Quick', 'Vegetarian'];
const noop = () => {};

describe('TagFilterChips — Sprint 23 warm palette', () => {
  it('renders all tags plus "All" chip', () => {
    render(<TagFilterChips availableTags={TAGS} selectedTag={null} onSelectTag={noop} />);
    expect(screen.getByText('All')).toBeTruthy();
    TAGS.forEach(tag => expect(screen.getByText(tag)).toBeTruthy());
  });

  it('unselected tag uses warm stone inline styles', () => {
    render(<TagFilterChips availableTags={TAGS} selectedTag={null} onSelectTag={noop} />);
    const chip = screen.getByText('Italian');
    const style = chip.getAttribute('style') || '';
    expect(style).toContain('--fs-bg-elevated');
    expect(style).toContain('--fs-text-secondary');
    expect(style).toContain('--fs-border-default');
  });

  it('selected tag uses amber active inline styles', () => {
    render(<TagFilterChips availableTags={TAGS} selectedTag="Quick" onSelectTag={noop} />);
    const chip = screen.getByText('Quick');
    const style = chip.getAttribute('style') || '';
    expect(style).toContain('--fs-accent-light');
    expect(style).toContain('--fs-accent-text');
    expect(style).toContain('--fs-border-accent');
  });

  it('"All" chip selected uses amber accent styles', () => {
    render(<TagFilterChips availableTags={TAGS} selectedTag={null} onSelectTag={noop} />);
    const allChip = screen.getByText('All');
    const style = allChip.getAttribute('style') || '';
    expect(style).toContain('--fs-accent-light');
  });

  it('no blue color references in any chip', () => {
    render(<TagFilterChips availableTags={TAGS} selectedTag="Italian" onSelectTag={noop} />);
    const allChips = screen.getAllByRole('button');
    allChips.forEach(chip => {
      const className = chip.className || '';
      expect(className).not.toContain('blue');
    });
  });

  it('clicking a tag calls onSelectTag with tag name', () => {
    const onSelect = vi.fn();
    render(<TagFilterChips availableTags={TAGS} selectedTag={null} onSelectTag={onSelect} />);
    fireEvent.click(screen.getByText('Italian'));
    expect(onSelect).toHaveBeenCalledWith('Italian');
  });

  it('clicking selected tag deselects (passes null)', () => {
    const onSelect = vi.fn();
    render(<TagFilterChips availableTags={TAGS} selectedTag="Italian" onSelectTag={onSelect} />);
    fireEvent.click(screen.getByText('Italian'));
    expect(onSelect).toHaveBeenCalledWith(null);
  });

  it('returns null when no tags available', () => {
    const { container } = render(<TagFilterChips availableTags={[]} selectedTag={null} onSelectTag={noop} />);
    expect(container.innerHTML).toBe('');
  });

  it('has accessible group role and label', () => {
    render(<TagFilterChips availableTags={TAGS} selectedTag={null} onSelectTag={noop} />);
    const group = screen.getByRole('group');
    expect(group).toBeTruthy();
    expect(group.getAttribute('aria-label')).toBe('Filter by tag');
  });
});
