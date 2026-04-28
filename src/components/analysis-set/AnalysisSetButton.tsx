import React from 'react';
import { useTranslation } from 'react-i18next';
import { FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAnalysisSet } from '@/contexts/AnalysisSetContext';
import AnalysisSetDrawer from './AnalysisSetDrawer';
import { useIsMobile } from '@/hooks/use-mobile';

const AnalysisSetButton: React.FC = () => {
  const { t } = useTranslation('analysis');
  const { itemCount, setIsOpen } = useAnalysisSet();
  const isMobile = useIsMobile();

  const positionClass = isMobile
    ? "fixed bottom-28 right-4 z-40"
    : "fixed bottom-6 right-6 z-50";

  if (itemCount === 0) {
    return <AnalysisSetDrawer />;
  }

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className={`${positionClass} h-12 px-4 rounded-full shadow-lg bg-primary hover:bg-primary/90 glow-effect`}
        size="lg"
        aria-label={t('floatingButton.aria', { count: itemCount })}
      >
        <FileText className="h-5 w-5 mr-2" />
        <span className="font-semibold">{t('floatingButton.label')}</span>
        <span className="ml-2 bg-secondary text-secondary-foreground text-xs font-bold px-2 py-0.5 rounded-full">
          {itemCount}
        </span>
      </Button>
      <AnalysisSetDrawer />
    </>
  );
};

export default AnalysisSetButton;
