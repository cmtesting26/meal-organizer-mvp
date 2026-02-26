/**
 * Settings Page (Sprint 23 update)
 *
 * Sprint 23: WarmHeader integration, OptionButton for theme/language,
 * unified warm styling per Design Spec V1.6.
 */

import { Shield, Globe, Upload, Palette, LifeBuoy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { DataManagement } from '@/components/common/DataManagement';
import { MigrationWizard } from '@/components/migration/MigrationWizard';
import { AccountSection } from '@/components/settings/AccountSection';
import { WarmHeader } from '@/components/common/WarmHeader';
import { OptionButton } from '@/components/common/OptionButton';
import { useAuth } from '@/hooks/useAuth';
import { useTheme, type ThemePreference } from '@/hooks/useTheme';
import { hasLocalData, getMigrationStatus } from '@/lib/migrationService';
import { Sun, Moon, Monitor } from 'lucide-react';

export function Settings() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { isAuthenticated } = useAuth();
  const { preference, setTheme } = useTheme();
  const [showMigrationWizard, setShowMigrationWizard] = useState(false);
  const [canMigrate, setCanMigrate] = useState(false);

  const currentLang = i18n.language?.startsWith('de') ? 'de' : 'en';

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  // Check if migration is available
  useEffect(() => {
    if (!isAuthenticated) return;
    const status = getMigrationStatus();
    if (status === 'completed') {
      setCanMigrate(false);
      return;
    }
    hasLocalData().then(setCanMigrate);
  }, [isAuthenticated]);

  return (
    <div>
      {/* Warm Header */}
      <WarmHeader
        title={t('settings.title')}
        backButton
        onBack={() => navigate(-1)}
      />

      <div className="max-w-2xl mx-auto px-5 pt-4 pb-8">
        {/* Account Section */}
        <AccountSection />

        {/* Migration Button */}
        {isAuthenticated && canMigrate && !showMigrationWizard && (
          <div className="rounded-2xl p-4 mb-3" style={{ backgroundColor: 'var(--fs-warning-bg, #FAF8F6)', boxShadow: '0 2px 12px #2D252208' }}>
            <div className="flex items-center gap-3 mb-2">
              <Upload className="w-5 h-5" style={{ color: 'var(--fs-accent, #D4644E)' }} />
              <div>
                <p className="font-medium text-sm" style={{ color: 'var(--fs-text-primary)' }}>{t('settings.migrateData')}</p>
                <p className="text-xs" style={{ color: 'var(--fs-text-muted)' }}>{t('settings.migrateDataDescription')}</p>
              </div>
            </div>
            <Button
              size="sm"
              className="w-full"
              style={{ backgroundColor: 'var(--fs-accent, #D4644E)', color: 'white' }}
              onClick={() => setShowMigrationWizard(true)}
            >
              <Upload className="w-4 h-4 mr-2" />
              {t('migration.migrateNow')}
            </Button>
          </div>
        )}

        {/* Inline Migration Wizard */}
        {showMigrationWizard && (
          <div className="mb-6">
            <MigrationWizard
              onDismiss={() => {
                setShowMigrationWizard(false);
                setCanMigrate(false);
              }}
              inline
            />
          </div>
        )}

        {/* Appearance / Theme — using OptionButton */}
        <div className="rounded-2xl p-4 mb-3" style={{ backgroundColor: '#FFFFFF', boxShadow: '0 2px 12px #2D252208' }}>
          <div className="flex items-center gap-3 mb-3">
            <Palette className="w-5 h-5" style={{ color: 'var(--fs-text-muted)' }} />
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--fs-text-primary)' }}>{t('settings.appearance')}</p>
              <p className="text-xs" style={{ color: 'var(--fs-text-muted)' }}>{t('settings.appearanceDescription')}</p>
            </div>
          </div>
          <OptionButton
            options={[
              { key: 'system', label: t('settings.themeSystem'), icon: <Monitor className="w-4 h-4" /> },
              { key: 'light', label: t('settings.themeLight'), icon: <Sun className="w-4 h-4" /> },
              { key: 'dark', label: t('settings.themeDark'), icon: <Moon className="w-4 h-4" /> },
            ]}
            activeKey={preference}
            onSelect={(key) => setTheme(key as ThemePreference)}
          />
        </div>

        {/* Language — using OptionButton */}
        <div className="rounded-2xl p-4 mb-3" style={{ backgroundColor: '#FFFFFF', boxShadow: '0 2px 12px #2D252208' }}>
          <div className="flex items-center gap-3 mb-3">
            <Globe className="w-5 h-5" style={{ color: 'var(--fs-text-muted)' }} />
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--fs-text-primary)' }}>{t('settings.language')}</p>
              <p className="text-xs" style={{ color: 'var(--fs-text-muted)' }}>{t('settings.languageDescription')}</p>
            </div>
          </div>
          <OptionButton
            options={[
              { key: 'en', label: `🇬🇧 ${t('settings.english')}` },
              { key: 'de', label: `🇩🇪 ${t('settings.german')}` },
            ]}
            activeKey={currentLang}
            onSelect={handleLanguageChange}
          />
        </div>

        {/* Data Management */}
        <DataManagement onImportComplete={() => window.location.reload()} />

        {/* Links */}
        <div className="space-y-3">
          <button
            onClick={() => navigate('/help')}
            className="w-full flex items-center gap-3 p-3 rounded-2xl transition-colors text-left"
            style={{ backgroundColor: '#FFFFFF', boxShadow: '0 2px 12px #2D252208' }}
          >
            <LifeBuoy className="w-5 h-5" style={{ color: 'var(--fs-text-muted, #7A6E66)' }} />
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--fs-text-primary, #2D2522)' }}>{t('settings.helpFaq')}</p>
              <p className="text-xs" style={{ color: 'var(--fs-text-muted, #7A6E66)' }}>{t('settings.helpFaqDescription')}</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/privacy')}
            className="w-full flex items-center gap-3 p-3 rounded-2xl transition-colors text-left"
            style={{ backgroundColor: '#FFFFFF', boxShadow: '0 2px 12px #2D252208' }}
          >
            <Shield className="w-5 h-5" style={{ color: 'var(--fs-text-muted, #7A6E66)' }} />
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--fs-text-primary, #2D2522)' }}>{t('settings.privacyPolicy')}</p>
              <p className="text-xs" style={{ color: 'var(--fs-text-muted, #7A6E66)' }}>{t('settings.privacyPolicyDescription')}</p>
            </div>
          </button>
        </div>

        {/* App Info */}
        <div className="text-xs space-y-1" style={{ color: '#44403C', paddingTop: '32px' }}>
          <p>{t('app.name')} {t('app.version')}</p>
          <p>{t('app.dataLocal')}</p>
          <a
            href="https://github.com/cmtesting26/meal-organizer-mvp"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--fs-accent-text, #B84835)' }}
          >
            {t('app.viewOnGithub')}
          </a>
        </div>
      </div>
    </div>
  );
}
