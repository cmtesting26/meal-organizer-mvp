/**
 * BottomNav Component (Sprint 23 update)
 *
 * 3-item bottom navigation: Schedule (left), elevated "+" FAB (center), Library (right).
 * Sprint 23: Amber active state for icons and labels (#D97706 active, #78716C inactive).
 *
 * Design Spec V1.6
 */

import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CalendarDays, BookOpen, Plus } from 'lucide-react';
import { type FC, type ReactNode } from 'react';
import { NotificationDot } from './NotificationDot';

interface NavItemProps {
  to: string;
  icon: ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  /** Show notification dot badge */
  showBadge?: boolean;
  badgeLabel?: string;
}

const NavItem: FC<NavItemProps> = ({ icon, label, active, onClick, showBadge, badgeLabel }) => {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-0.5
                  min-w-[44px] min-h-[44px] transition-colors relative
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--fs-accent)] focus-visible:ring-offset-1 rounded"
      style={{
        color: active ? 'var(--fs-nav-text-active, #B84835)' : 'var(--fs-nav-text, #3D3530)',
      }}
      aria-current={active ? 'page' : undefined}
      aria-label={label}
    >
      <span className="w-6 h-6 relative">
        {icon}
        <NotificationDot visible={!!showBadge} label={badgeLabel} />
      </span>
      <span
        className="text-[10px] leading-tight"
        style={{ fontWeight: active ? 600 : 500 }}
      >
        {label}
      </span>
    </button>
  );
};

interface BottomNavProps {
  onAddClick: () => void;
  /** Whether to show notification dot on Library tab */
  showLibraryBadge?: boolean;
  /** Count of new recipes (for accessibility label) */
  newRecipeCount?: number;
}

export function BottomNav({ onAddClick, showLibraryBadge, newRecipeCount }: BottomNavProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const isScheduleActive = location.pathname === '/';
  const isLibraryActive = location.pathname === '/library' || location.pathname.startsWith('/recipe/');

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex justify-center"
      aria-label={t('nav.main', 'Main navigation')}
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div
        className="flex items-center justify-around relative"
        style={{
          width: '340px',
          height: '56px',
          borderRadius: '28px',
          backgroundColor: '#FFFFFF',
          boxShadow: '0 4px 24px rgba(45, 37, 34, 0.09)',
          marginBottom: '12px',
        }}
      >
        {/* Schedule tab (left) */}
        <NavItem
          to="/"
          icon={<CalendarDays className="w-6 h-6" />}
          label={t('nav.schedule')}
          active={isScheduleActive}
          onClick={() => navigate('/')}
        />

        {/* Elevated FAB (center) — raised above nav bar */}
        <div className="flex items-center justify-center" style={{ marginTop: '-26px' }}>
          <button
            onClick={onAddClick}
            className="flex items-center justify-center
                       w-[60px] h-[60px] rounded-full
                       text-white
                       shadow-lg
                       transition-colors focus:outline-none focus:ring-2
                       focus:ring-offset-2"
            style={{
              backgroundColor: 'var(--fs-accent, #D4644E)',
              boxShadow: '0 4px 24px 2px rgba(212, 100, 78, 0.27)',
              '--tw-ring-color': 'var(--fs-accent, #D4644E)',
            } as React.CSSProperties}
            aria-label={t('nav.addRecipe', 'Add Recipe')}
          >
            <Plus className="w-8 h-8" strokeWidth={2.5} />
          </button>
        </div>

        {/* Library tab (right) — with notification dot */}
        <NavItem
          to="/library"
          icon={<BookOpen className="w-6 h-6" />}
          label={t('nav.library')}
          active={isLibraryActive}
          onClick={() => navigate('/library')}
          showBadge={showLibraryBadge && !isLibraryActive}
          badgeLabel={
            newRecipeCount
              ? t('nav.newRecipes', '{{count}} new recipes', { count: newRecipeCount })
              : undefined
          }
        />
      </div>
    </nav>
  );
}
