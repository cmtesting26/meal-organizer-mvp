/**
 * ErrorMessage Component (Sprint 7 — i18n)
 */

import { useTranslation } from 'react-i18next';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, WifiOff, Ban, FileX, RefreshCw } from 'lucide-react';

interface ErrorMessageProps {
  message?: string;
  type?: 'network' | 'parse' | 'cors' | 'general';
  onRetry?: () => void;
}

export function ErrorMessage({ message, type = 'general', onRetry }: ErrorMessageProps) {
  const { t } = useTranslation();

  const configs = {
    network: {
      icon: WifiOff,
      title: t('errors.networkTitle', 'Network Error'),
      message: message || t('errors.networkMessage', 'Could not connect to the server. Please check your internet connection.'),
      help: t('errors.networkHelp', 'Make sure you\'re connected to the internet and try again.'),
    },
    parse: {
      icon: FileX,
      title: t('errors.parseTitle', 'Could Not Import Recipe'),
      message: message || t('errors.parseMessage', 'We couldn\'t find recipe data on this page.'),
      help: t('errors.parseHelp', 'The website might not have a supported recipe format. Try manual entry instead.'),
    },
    cors: {
      icon: Ban,
      title: t('errors.corsTitle', 'Access Blocked'),
      message: message || t('errors.corsMessage', 'This website blocks automatic imports.'),
      help: t('errors.corsHelp', 'Some sites don\'t allow automatic imports. You can still add recipes manually.'),
    },
    general: {
      icon: AlertCircle,
      title: t('errors.generalTitle', 'Something Went Wrong'),
      message: message || t('errors.generalMessage', 'An unexpected error occurred.'),
      help: t('errors.generalHelp', 'Please try again. If the problem persists, try manual entry.'),
    },
  };

  const config = configs[type];
  const Icon = config.icon;

  return (
    <Alert variant="destructive" className="my-4">
      <Icon className="h-4 w-4" />
      <AlertTitle>{config.title}</AlertTitle>
      <AlertDescription className="space-y-2">
        <p>{config.message}</p>
        <p className="text-sm opacity-90">{config.help}</p>
        {onRetry && (
          <Button size="sm" variant="outline" onClick={onRetry} className="mt-2">
            <RefreshCw className="w-3 h-3 mr-2" />
            {t('errors.retry', 'Try Again')}
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
