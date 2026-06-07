import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

export interface StageChip {
  id: string;
  label: string;
}

interface Props {
  chips: StageChip[];
  selectedId: string;
  onSelect: (id: string) => void;
}

const triggerHaptic = () => {
  try { Haptics.impact({ style: ImpactStyle.Light }); } catch {}
};

const StageChipSelector: React.FC<Props> = ({ chips, selectedId, onSelect }) => {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-3 px-3 pb-1">
      {chips.map((chip) => {
        const isActive = chip.id === selectedId;
        return (
          <motion.button
            key={chip.id}
            onClick={() => { triggerHaptic(); onSelect(chip.id); }}
            whileTap={{ scale: 0.94 }}
            className={cn(
              'shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors',
              'touch-manipulation select-none border',
              isActive
                ? 'bg-primary text-primary-foreground border-primary shadow-[0_4px_14px_hsl(var(--primary)/0.25)]'
                : 'bg-card/60 text-muted-foreground border-border/30 active:bg-muted/40',
            )}
          >
            {chip.label}
          </motion.button>
        );
      })}
    </div>
  );
};

export default StageChipSelector;
