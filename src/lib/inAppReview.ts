import { Capacitor } from '@capacitor/core';
import { InAppReview } from '@capacitor-community/in-app-review';
import { logEvent } from './analytics';

const KEY = 'gm_last_review_prompt';
export const REVIEW_COOLDOWN_DAYS = 90;

export function canPromptReview(lastIso: string | null, now: Date = new Date()): boolean {
  if (!lastIso) return true;
  const last = new Date(lastIso).getTime();
  if (Number.isNaN(last)) return true;
  return now.getTime() - last >= REVIEW_COOLDOWN_DAYS * 86_400_000;
}

/** Ask Google Play to show its rating sheet after a positive moment (max once per 90 days). */
export async function maybeRequestReview(reason: string) {
  if (!Capacitor.isNativePlatform()) return;
  try {
    if (!canPromptReview(localStorage.getItem(KEY))) return;
    localStorage.setItem(KEY, new Date().toISOString());
    await InAppReview.requestReview();
    logEvent('review_prompt', { reason });
  } catch {
    /* ignore */
  }
}
