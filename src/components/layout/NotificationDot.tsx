/**
 * NotificationDot Component (Sprint 21)
 *
 * 8px red dot badge for the Library tab in BottomNav.
 * Appears when other household members have added new recipes
 * since the current user's last login.
 *
 * Design Spec V1.5 · Implementation Plan Phase 27–28
 */

interface NotificationDotProps {
  /** Whether to show the dot */
  visible: boolean;
  /** Accessible label for screen readers */
  label?: string;
}

export function NotificationDot({ visible, label }: NotificationDotProps) {
  if (!visible) return null;

  return (
    <span
      className="absolute -top-0.5 -right-0.5 flex h-2 w-2"
      role="status"
      aria-label={label || 'New items available'}
    >
      {/* Animated ping ring */}
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
      {/* Solid dot */}
      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
    </span>
  );
}
