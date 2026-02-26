/**
 * Help/FAQ Page (Sprint 7 — i18n, updated to D3 design)
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { WarmHeader } from '@/components/common/WarmHeader';

interface FaqItem {
  question: string;
  answer: string;
}

function useFaqItems(): FaqItem[] {
  const { t } = useTranslation();

  const sections = [
    { key: 'gettingStarted', count: 3 },
    { key: 'recipes', count: 4 },
    { key: 'dataPrivacy', count: 3 },
    { key: 'troubleshooting', count: 3 },
  ];

  const items: FaqItem[] = [];
  for (const section of sections) {
    for (let i = 1; i <= section.count; i++) {
      items.push({
        question: t(`helpFaq.sections.${section.key}.q${i}`),
        answer: t(`helpFaq.sections.${section.key}.a${i}`),
      });
    }
  }
  return items;
}

export function HelpFaq() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const faqItems = useFaqItems();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div>
      <WarmHeader
        title={t('helpFaq.title')}
        backButton
        onBack={() => navigate(-1)}
      />

      <div className="max-w-2xl mx-auto px-6 pb-8" style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: '8px' }}>
        <p
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '14px',
            color: 'var(--fs-text-secondary, #7A6E66)',
          }}
        >
          {t('helpFaq.intro', 'Find answers to common questions below.')}
        </p>

        {faqItems.map((item, idx) => (
          <div
            key={idx}
            style={{
              borderRadius: '14px',
              backgroundColor: 'var(--fs-card-bg, #FFFFFF)',
              border: '1px solid var(--fs-border-decorative, #E8DDD8)',
              overflow: 'hidden',
            }}
          >
            <button
              onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
              aria-expanded={openIndex === idx}
              className="w-full flex items-center justify-between text-left transition-colors"
              style={{ padding: '16px' }}
            >
              <span
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '15px',
                  fontWeight: 600,
                  color: 'var(--fs-text-primary, #2D2522)',
                  paddingRight: '16px',
                }}
              >
                {item.question}
              </span>
              {openIndex === idx ? (
                <ChevronDown className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--fs-text-muted, #7A6E66)' }} />
              ) : (
                <ChevronRight className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--fs-text-muted, #7A6E66)' }} />
              )}
            </button>
            {openIndex === idx && (
              <div style={{ padding: '0 16px 16px' }}>
                <p
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '14px',
                    lineHeight: 1.5,
                    color: 'var(--fs-text-secondary, #7A6E66)',
                  }}
                >
                  {item.answer}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
