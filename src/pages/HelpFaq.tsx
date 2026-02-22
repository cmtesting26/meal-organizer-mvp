/**
 * Help/FAQ Page (Sprint 7 — i18n)
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, HelpCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface FaqItem {
  question: string;
  answer: string;
}

function useFaqSections(): { title: string; items: FaqItem[] }[] {
  const { t } = useTranslation();

  return [
    {
      title: t('helpFaq.sections.gettingStarted.title'),
      items: [
        { question: t('helpFaq.sections.gettingStarted.q1'), answer: t('helpFaq.sections.gettingStarted.a1') },
        { question: t('helpFaq.sections.gettingStarted.q2'), answer: t('helpFaq.sections.gettingStarted.a2') },
        { question: t('helpFaq.sections.gettingStarted.q3'), answer: t('helpFaq.sections.gettingStarted.a3') },
      ],
    },
    {
      title: t('helpFaq.sections.recipes.title'),
      items: [
        { question: t('helpFaq.sections.recipes.q1'), answer: t('helpFaq.sections.recipes.a1') },
        { question: t('helpFaq.sections.recipes.q2'), answer: t('helpFaq.sections.recipes.a2') },
        { question: t('helpFaq.sections.recipes.q3'), answer: t('helpFaq.sections.recipes.a3') },
        { question: t('helpFaq.sections.recipes.q4'), answer: t('helpFaq.sections.recipes.a4') },
      ],
    },
    {
      title: t('helpFaq.sections.dataPrivacy.title'),
      items: [
        { question: t('helpFaq.sections.dataPrivacy.q1'), answer: t('helpFaq.sections.dataPrivacy.a1') },
        { question: t('helpFaq.sections.dataPrivacy.q2'), answer: t('helpFaq.sections.dataPrivacy.a2') },
        { question: t('helpFaq.sections.dataPrivacy.q3'), answer: t('helpFaq.sections.dataPrivacy.a3') },
      ],
    },
    {
      title: t('helpFaq.sections.troubleshooting.title'),
      items: [
        { question: t('helpFaq.sections.troubleshooting.q1'), answer: t('helpFaq.sections.troubleshooting.a1') },
        { question: t('helpFaq.sections.troubleshooting.q2'), answer: t('helpFaq.sections.troubleshooting.a2') },
        { question: t('helpFaq.sections.troubleshooting.q3'), answer: t('helpFaq.sections.troubleshooting.a3') },
      ],
    },
  ];
}

function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="space-y-2">
      {items.map((item, idx) => (
        <div key={idx} className="border rounded-lg overflow-hidden bg-white">
          <button
            onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
          >
            <span className="text-sm font-medium text-gray-900 pr-4">{item.question}</span>
            {openIndex === idx ? (
              <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
            )}
          </button>
          {openIndex === idx && (
            <div className="px-4 pb-4 text-sm text-gray-600 leading-relaxed border-t bg-gray-50">
              <p className="pt-3">{item.answer}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function HelpFaq() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const faqSections = useFaqSections();

  return (
    <div className="max-w-2xl mx-auto">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-1" />
        {t('helpFaq.backButton')}
      </Button>

      <div className="flex items-center gap-3 mb-6">
        <HelpCircle className="w-7 h-7 text-primary" />
        <h1 className="text-2xl font-bold text-gray-900">{t('helpFaq.title')}</h1>
      </div>

      <div className="space-y-8 pb-8">
        {faqSections.map((section, idx) => (
          <div key={idx}>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">{section.title}</h2>
            <FaqAccordion items={section.items} />
          </div>
        ))}
      </div>
    </div>
  );
}
