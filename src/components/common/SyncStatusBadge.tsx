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
    dotColor: 'bg-amber-500',
    textKey: 'sync.syncing',
    animate: true,
  },
  offline: {
    icon: CloudOff,
    dotColor: 'bg-gray-400',
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
      className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors"
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
        <span className="bg-amber-100 text-amber-700 text-[10px] font-medium px-1 rounded-full">
          {syncState.queueLength}
        </span>
      )}
    </button>
  );
}
