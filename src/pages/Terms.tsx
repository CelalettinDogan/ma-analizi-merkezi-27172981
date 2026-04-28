import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const Terms: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation('legal');

  const bodySections = ['service', 'disclaimer', 'premium', 'ip', 'changes'] as const;
  const conditionsItems = t('terms.sections.conditions.items', { returnObjects: true }) as string[];

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border pt-safe">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="h-9 w-9"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">{t('terms.title')}</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <Card>
          <CardContent className="p-6 prose prose-sm dark:prose-invert max-w-none">
            <p className="text-muted-foreground text-sm mb-6">{t('terms.lastUpdate')}</p>

            {/* Service */}
            <h2 className="text-lg font-semibold mt-6 mb-3">{t('terms.sections.service.title')}</h2>
            <p className="text-muted-foreground">{t('terms.sections.service.body')}</p>

            {/* Conditions with list */}
            <h2 className="text-lg font-semibold mt-6 mb-3">{t('terms.sections.conditions.title')}</h2>
            <p className="text-muted-foreground">{t('terms.sections.conditions.intro')}</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-2">
              {conditionsItems.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>

            {/* Remaining body sections (skip 'service' since rendered above) */}
            {bodySections.filter(k => k !== 'service').map((key) => (
              <React.Fragment key={key}>
                <h2 className="text-lg font-semibold mt-6 mb-3">{t(`terms.sections.${key}.title`)}</h2>
                <p className="text-muted-foreground">{t(`terms.sections.${key}.body`)}</p>
              </React.Fragment>
            ))}

            {/* Contact */}
            <h2 className="text-lg font-semibold mt-6 mb-3">{t('terms.sections.contact.title')}</h2>
            <p className="text-muted-foreground">
              {t('terms.sections.contact.body', { email: 'info@golmetrik.com' })}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Terms;
