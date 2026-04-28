import React from 'react';
import { WifiOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

const OfflineBanner: React.FC = () => {
  const { t } = useTranslation('home');
  const isOnline = useOnlineStatus();

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          role="alert"
          aria-live="assertive"
          initial={{ y: -48, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -48, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="fixed top-0 left-0 right-0 z-[9999] bg-destructive text-destructive-foreground flex items-center justify-center gap-2 py-2 text-sm font-medium pt-safe"
        >
          <WifiOff className="h-4 w-4" />
          <span>{t('offline.noConnection')}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OfflineBanner;
