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
                  min-w-[44px] min-h-[44px] transition-colors relative"
      style={{
        color: active ? '#D97706' : 'var(--fs-nav-text, #78716C)',
      }}
      aria-current={active ? 'page' : undefined}
      aria-label={label}
    >
      <span className="w-6 h-6 relative">
        {icon}
        <NotificationDot visible={!!showBadge} label={badgeLabel} />
      </span>
      <span
        className="text-[11px] leading-tight"
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
      className="fixed bottom-0 left-0 right-0 z-50"
      aria-label={t('nav.main', 'Main navigation')}
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        backgroundColor: 'var(--fs-nav-bg)',
        borderTop: '1px solid var(--fs-nav-border)',
      }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-around h-14 px-6">
        {/* Schedule tab (left) */}
        <NavItem
          to="/"
          icon={<CalendarDays className="w-6 h-6" />}
          label={t('nav.schedule')}
          active={isScheduleActive}
          onClick={() => navigate('/')}
        />

        {/* Elevated FAB (center) — raised above nav bar */}
        <div className="flex items-center justify-center -mt-10">
          <button
            onClick={onAddClick}
            className="flex items-center justify-center
                       w-[60px] h-[60px] rounded-full
                       bg-amber-600 text-white
                       shadow-lg shadow-amber-600/30
                       hover:bg-amber-700 active:bg-amber-800
                       transition-colors focus:outline-none focus:ring-2
                       focus:ring-amber-600 focus:ring-offset-2"
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
