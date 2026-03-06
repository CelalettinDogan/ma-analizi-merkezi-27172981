import React, { useEffect, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  MatchHeroCard,
  AIRecommendationCard,
  PredictionPillSelector,
  H2HTimeline,
  TeamComparisonCard,
  CollapsibleAnalysis,
} from '@/components/analysis';
import AnalysisHeroSummary from './AnalysisHeroSummary';
import LegalDisclaimer from '@/components/LegalDisclaimer';

interface AnalysisDrawerProps {
  analysis: any;
  isOpen: boolean;
  onClose: () => void;
}

const SNAP_PEEK = 0.4;   // 40% of viewport
const SNAP_FULL = 0.93;  // 93% of viewport
const VELOCITY_THRESHOLD = 0.5;

const AnalysisDrawer: React.FC<AnalysisDrawerProps> = ({ analysis, isOpen, onClose }) => {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [snapPoint, setSnapPoint] = useState<number>(SNAP_PEEK);
  const drawerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Touch tracking (drag handle)
  const touchStartY = useRef(0);
  const touchStartTime = useRef(0);
  const currentTranslateY = useRef(0);
  const isDragging = useRef(false);

  // Peek tap-to-expand tracking
  const peekTouchStartY = useRef(0);
  const peekTouchMoved = useRef(false);

  // Mount → forced reflow → animate in
  useEffect(() => {
    let rafId: number;
    if (isOpen && analysis) {
      setMounted(true);
      setSnapPoint(SNAP_PEEK);
      rafId = requestAnimationFrame(() => {
        drawerRef.current?.offsetHeight;
        requestAnimationFrame(() => {
          setVisible(true);
        });
      });
      return () => cancelAnimationFrame(rafId);
    } else {
      setVisible(false);
      const timeout = setTimeout(() => {
        setMounted(false);
        setSnapPoint(SNAP_PEEK);
      }, 350);
      return () => clearTimeout(timeout);
    }
  }, [isOpen, analysis]);

  // Lock body scroll
  useEffect(() => {
    if (visible) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [visible]);

  const getDrawerHeight = useCallback(() => {
    return snapPoint * window.innerHeight;
  }, [snapPoint]);

  const expandToFull = useCallback(() => {
    setSnapPoint(SNAP_FULL);
  }, []);

  // Touch handlers for drag handle area
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // Only drag from handle area or when scroll is at top
    const scrollEl = scrollRef.current;
    const isAtTop = !scrollEl || scrollEl.scrollTop <= 0;
    
    if (!isAtTop && snapPoint === SNAP_FULL) return;
    
    touchStartY.current = e.touches[0].clientY;
    touchStartTime.current = Date.now();
    currentTranslateY.current = 0;
    isDragging.current = true;
  }, [snapPoint]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current) return;
    
    const deltaY = e.touches[0].clientY - touchStartY.current;
    currentTranslateY.current = deltaY;

    if (drawerRef.current && deltaY > 0) {
      drawerRef.current.style.transform = `translateY(${deltaY}px)`;
      drawerRef.current.style.transition = 'none';
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;

    const deltaY = currentTranslateY.current;
    const elapsed = (Date.now() - touchStartTime.current) / 1000;
    const velocity = Math.abs(deltaY) / elapsed;

    if (drawerRef.current) {
      drawerRef.current.style.transform = '';
      drawerRef.current.style.transition = '';
    }

    // Swipe down → close or collapse
    if (deltaY > 50 || (deltaY > 20 && velocity > VELOCITY_THRESHOLD)) {
      if (snapPoint === SNAP_FULL) {
        setSnapPoint(SNAP_PEEK);
      } else {
        onClose();
      }
      return;
    }

    // Swipe up → expand
    if (deltaY < -50 || (deltaY < -20 && velocity > VELOCITY_THRESHOLD)) {
      if (snapPoint === SNAP_PEEK) {
        setSnapPoint(SNAP_FULL);
      }
    }
  }, [snapPoint, onClose]);

  // Peek tap-to-expand handlers
  const INTERACTIVE_SELECTOR = 'button, a, input, textarea, select, [role="button"], [role="link"], [role="tab"], [data-interactive], [contenteditable="true"]';
  const PEEK_DRAG_THRESHOLD = 8;

  const handlePeekTouchStart = useCallback((e: React.TouchEvent) => {
    peekTouchStartY.current = e.touches[0].clientY;
    peekTouchMoved.current = false;
  }, []);

  const handlePeekTouchMove = useCallback((e: React.TouchEvent) => {
    if (peekTouchMoved.current) return;
    const delta = Math.abs(e.touches[0].clientY - peekTouchStartY.current);
    if (delta > PEEK_DRAG_THRESHOLD) {
      peekTouchMoved.current = true;
    }
  }, []);

  const isInteractiveTarget = useCallback((target: HTMLElement, container: HTMLElement) => {
    const interactive = target.closest(INTERACTIVE_SELECTOR);
    // If the matched interactive element is the wrapper itself, it's not a nested interactive
    return interactive !== null && interactive !== container;
  }, []);

  const handlePeekTouchEnd = useCallback((e: React.TouchEvent) => {
    if (peekTouchMoved.current) return;
    if (isInteractiveTarget(e.target as HTMLElement, e.currentTarget as HTMLElement)) return;
    expandToFull();
  }, [expandToFull, isInteractiveTarget]);

  const handlePeekClick = useCallback((e: React.MouseEvent) => {
    if (isInteractiveTarget(e.target as HTMLElement, e.currentTarget as HTMLElement)) return;
    expandToFull();
  }, [expandToFull, isInteractiveTarget]);

  const handlePeekKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      expandToFull();
    }
  }, [expandToFull]);

  if (!mounted) return null;

  const height = getDrawerHeight();
  const isPeek = snapPoint === SNAP_PEEK;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300 ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ touchAction: 'none' }}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className={`fixed inset-x-0 bottom-0 z-50 bg-background/95 backdrop-blur-xl rounded-t-2xl overflow-hidden flex flex-col transition-all duration-300 ease-out ${
          visible ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{
          height: `${height}px`,
          maxHeight: `calc(${height}px - env(safe-area-inset-top, 0px))`,
          willChange: 'transform, height',
          boxShadow: '0 -8px 32px rgba(0,0,0,0.3)',
        }}
      >
        {/* Drag handle + Close */}
        <div
          className="flex items-center justify-between px-4 pt-3 pb-2 shrink-0 cursor-grab active:cursor-grabbing"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="flex-1 flex justify-center">
            <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 rounded-full absolute right-3 top-3"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        {analysis && (
          <>
            {isPeek ? (
              /* Peek mode: Hero Summary — tap anywhere to expand */
              <div
                role="button"
                tabIndex={0}
                aria-label="Detaylar için dokun"
                className="cursor-pointer transition-transform duration-150 active:scale-[0.995]"
                onTouchStart={handlePeekTouchStart}
                onTouchMove={handlePeekTouchMove}
                onTouchEnd={handlePeekTouchEnd}
                onKeyDown={handlePeekKeyDown}
                onClick={handlePeekClick}
              >
                <AnalysisHeroSummary analysis={analysis} />
              </div>
            ) : (
              /* Full mode: All content */
              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto overscroll-contain"
                style={{ WebkitOverflowScrolling: 'touch' }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <div className="px-4 py-4 space-y-4" style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom, 0px))' }}>
                  <MatchHeroCard
                    match={analysis.input}
                    insights={analysis.insights}
                    homeTeamCrest={analysis.input.homeTeamCrest}
                    awayTeamCrest={analysis.input.awayTeamCrest}
                  />

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <AIRecommendationCard
                      predictions={analysis.predictions}
                      matchInput={analysis.input}
                    />
                    <div className="p-4 rounded-2xl bg-card border border-border/50">
                      <PredictionPillSelector
                        predictions={analysis.predictions}
                        matchInput={analysis.input}
                      />
                    </div>
                  </div>

                  <TeamComparisonCard
                    homeTeam={analysis.input.homeTeam}
                    awayTeam={analysis.input.awayTeam}
                    homeStats={analysis.homeTeamStats}
                    awayStats={analysis.awayTeamStats}
                    homePower={analysis.homePower}
                    awayPower={analysis.awayPower}
                  />

                  <H2HTimeline
                    h2h={analysis.headToHead}
                    homeTeam={analysis.input.homeTeam}
                    awayTeam={analysis.input.awayTeam}
                  />

                  {/* Advanced Analysis — Accordion */}
                  <CollapsibleAnalysis analysis={analysis} />

                  <LegalDisclaimer />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>,
    document.body
  );
};

export default AnalysisDrawer;
