/**
 * SyncStatusBadge (Sprint 10)
 *
 * Visual indicator for sync status displayed in the app header.
 * - Green dot: synced
 * - Amber pulsing dot: syncing
 * - Gray dot: offline
 * - Red dot: error (with tooltip)
 *
 * @module SyncStatusBadge
 */

import { useTranslation } from 'react-i18next';
import { useSyncState } from '@/hooks/useSyncProvider';
import { Cloud, CloudOff, RefreshCw, AlertCircle } from 'lucide-react';

const statusConfig = {
  synced: {
    icon: Cloud,
    dotColor: 'bg-green-500',
    textKey: 'sync.synced',
    animate: false,
  },
  syncing: {
    icon: RefreshCw,
    dotColor: 'bg-[var(--fs-accent)]',
    textKey: 'sync.syncing',
    animate: true,
  },
  offline: {
    icon: CloudOff,
    dotColor: 'bg-[var(--fs-text-muted)]',
    textKey: 'sync.offline',
    animate: false,
  },
  error: {
    icon: AlertCircle,
    dotColor: 'bg-red-500',
    textKey: 'sync.error',
    animate: false,
  },
} as const;

interface SyncStatusBadgeProps {
  /** Whether to show the text label alongside the icon. Defaults to false (icon only). */
  showLabel?: boolean;
}

export function SyncStatusBadge({ showLabel = false }: SyncStatusBadgeProps) {
  const { t } = useTranslation();
  const { syncState, forceSync, syncAvailable } = useSyncState();

  // Don't render if sync is not available (local-only mode)
  if (!syncAvailable) return null;

  const config = statusConfig[syncState.status];
  const Icon = config.icon;
  const label = t(config.textKey);

  return (
    <button
      onClick={() => forceSync()}
      className="flex items-center gap-1.5 text-xs hover:text-[var(--fs-text-secondary)] transition-colors"
      style={{ color: 'var(--fs-text-muted, #7A6E66)' }}
      title={
        syncState.error
          ? `${label}: ${syncState.error}`
          : syncState.queueLength > 0
            ? t('sync.pendingChanges', { count: syncState.queueLength })
            : label
      }
      aria-label={label}
    >
      {/* Status dot */}
      <span className="relative flex h-2.5 w-2.5">
        {config.animate && (
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full ${config.dotColor} opacity-75`}
          />
        )}
        <span
          className={`relative inline-flex rounded-full h-2.5 w-2.5 ${config.dotColor}`}
        />
      </span>

      {/* Icon */}
      <Icon
        className={`w-5 h-5 ${config.animate ? 'animate-spin' : ''}`}
      />

      {/* Optional label */}
      {showLabel && <span>{label}</span>}

      {/* Queue count badge */}
      {syncState.queueLength > 0 && (
        <span className="text-[10px] font-medium px-1 rounded-full" style={{ backgroundColor: 'var(--fs-filter-active-bg, #FEF0E8)', color: 'var(--fs-accent-text, #B84835)' }}>
          {syncState.queueLength}
        </span>
      )}
    </button>
  );
}
