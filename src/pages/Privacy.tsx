import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const renderInline = (text: string) => {
  // Convert **bold** to <strong>
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith('**') && p.endsWith('**') ? (
      <strong key={i}>{p.slice(2, -2)}</strong>
    ) : (
      <React.Fragment key={i}>{p}</React.Fragment>
    )
  );
};

const Privacy: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation('legal');

  const sectionsWithList = ['collection', 'use', 'security', 'sharing', 'rights'] as const;
  const sectionsWithBody = ['cookies', 'children', 'changes'] as const;

  return (
    <div className="min-h-screen bg-background" style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))' }}>
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border pt-safe">
        <div className="container mx-auto px-4 h-14 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="min-w-[44px] min-h-[44px]"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold">{t('privacy.title')}</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="space-y-6">
          <p className="text-muted-foreground text-sm">{t('privacy.lastUpdate')}</p>

          {sectionsWithList.map((key) => {
            const items = t(`privacy.sections.${key}.items`, { returnObjects: true }) as string[];
            return (
              <Section key={key} title={t(`privacy.sections.${key}.title`)}>
                <p>{t(`privacy.sections.${key}.intro`)}</p>
                <ul className="list-disc list-inside space-y-2 mt-2">
                  {items.map((item, idx) => (
                    <li key={idx}>{renderInline(item)}</li>
                  ))}
                </ul>
              </Section>
            );
          })}

          {sectionsWithBody.map((key) => (
            <Section key={key} title={t(`privacy.sections.${key}.title`)}>
              <p>{t(`privacy.sections.${key}.body`)}</p>
            </Section>
          ))}

          <Section title={t('privacy.sections.contact.title')}>
            <p>
              <Trans
                i18nKey="privacy.sections.contact.body"
                t={t}
                values={{ email: 'info@golmetrik.com' }}
                components={{ 1: <span className="text-primary active:opacity-70" /> }}
              />
            </p>
          </Section>

          <Section title={t('privacy.sections.deletion.title')}>
            <p>{t('privacy.sections.deletion.intro')}</p>
            <p className="mt-3">
              <strong>{t('privacy.sections.deletion.method1Title')}</strong><br />
              {t('privacy.sections.deletion.method1Body')}
            </p>
            <p className="mt-3">
              <strong>{t('privacy.sections.deletion.method2Title')}</strong><br />
              <button onClick={() => navigate('/delete-account')} className="text-primary active:opacity-70">
                {t('privacy.sections.deletion.method2LinkText')}
              </button>{' '}
              {t('privacy.sections.deletion.method2Suffix')}
            </p>
            <p className="mt-3"><strong>{t('privacy.sections.deletion.includesTitle')}</strong></p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              {(t('privacy.sections.deletion.includes', { returnObjects: true }) as string[]).map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
            <p className="text-amber-500 text-sm mt-3">
              {t('privacy.sections.deletion.note')}
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section>
    <h2 className="text-base font-semibold mb-2">{title}</h2>
    <div className="text-sm text-muted-foreground">{children}</div>
  </section>
);

export default Privacy;
