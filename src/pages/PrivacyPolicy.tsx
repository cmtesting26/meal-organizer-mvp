/**
 * PrivacyPolicy Page (Sprint 7 — i18n)
 */

import { useTranslation } from 'react-i18next';
import { ArrowLeft, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const sectionKeys = [
  'dataStorage', 'cloudSync', 'publicSharing', 'noAccounts', 'recipeImport', 'cookies', 'thirdParty', 'dataControl', 'contact'
] as const;

export function PrivacyPolicy() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="max-w-2xl mx-auto">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-1" />
        {t('privacyPolicy.backButton')}
      </Button>

      <div className="flex items-center gap-3 mb-6">
        <Shield className="w-7 h-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('privacyPolicy.title')}</h1>
          <p className="text-xs text-gray-500">{t('privacyPolicy.lastUpdated')}</p>
        </div>
      </div>

      <div className="space-y-6 pb-8">
        <p className="text-sm text-gray-600 leading-relaxed">{t('privacyPolicy.intro')}</p>

        {sectionKeys.map((key) => (
          <div key={key} className="border rounded-lg p-4 bg-white">
            <h2 className="font-semibold text-gray-900 mb-2">
              {t(`privacyPolicy.sections.${key}.title`)}
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              {t(`privacyPolicy.sections.${key}.content`)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
