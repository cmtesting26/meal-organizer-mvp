/**
 * PrivacyPolicy Page (Sprint 7 — i18n, updated to D3 design)
 */

import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { WarmHeader } from '@/components/common/WarmHeader';

const sectionKeys = [
  'dataStorage', 'cloudSync', 'publicSharing', 'noAccounts', 'recipeImport', 'cookies', 'thirdParty', 'dataControl', 'contact'
] as const;

export function PrivacyPolicy() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div>
      <WarmHeader
        title={t('privacyPolicy.title')}
        backButton
        onBack={() => navigate(-1)}
      />

      <div className="max-w-2xl mx-auto px-6 pb-8" style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: '8px' }}>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: 'var(--fs-text-secondary, #7A6E66)' }}>
          {t('privacyPolicy.lastUpdated')}
        </p>

        {sectionKeys.map((key) => (
          <div
            key={key}
            style={{
              borderRadius: '14px',
              backgroundColor: 'var(--fs-card-bg, #FFFFFF)',
              border: '1px solid var(--fs-border-decorative, #E8DDD8)',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <h2
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '15px',
                fontWeight: 600,
                color: 'var(--fs-text-primary, #2D2522)',
              }}
            >
              {t(`privacyPolicy.sections.${key}.title`)}
            </h2>
            <p
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '14px',
                lineHeight: 1.5,
                color: 'var(--fs-text-secondary, #7A6E66)',
              }}
            >
              {t(`privacyPolicy.sections.${key}.content`)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
