/**
 * PWAPrompt Component (Sprint 7)
 *
 * Shows an update banner when a new service worker is available.
 * Uses vite-plugin-pwa's useRegisterSW hook.
 */

import { useTranslation } from 'react-i18next';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function PWAPrompt() {
  const { t } = useTranslation();
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, r) {
      // Check for updates every hour
      if (r) {
        setInterval(() => {
          r.update();
        }, 60 * 60 * 1000);
      }
    },
    onRegisterError(error) {
      console.error('SW registration error:', error);
    },
  });

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 bg-white border border-green-200 rounded-lg shadow-lg p-4 flex items-center justify-between gap-3 animate-in slide-in-from-bottom">
      <div className="flex items-center gap-2">
        <RefreshCw className="w-5 h-5 text-green-600" />
        <p className="text-sm font-medium text-gray-800">
          {t('pwa.updateAvailable')}
        </p>
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setNeedRefresh(false)}
        >
          ✕
        </Button>
        <Button
          size="sm"
          onClick={() => updateServiceWorker(true)}
          className="bg-green-600 hover:bg-green-700"
        >
          {t('pwa.updateNow')}
        </Button>
      </div>
    </div>
  );
}
