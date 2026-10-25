import { describe, it, expect, vi } from 'vitest';
vi.mock('@capacitor-community/in-app-review', () => ({ InAppReview: { requestReview: vi.fn() } }));
import { canPromptReview } from '@/lib/inAppReview';

describe('in-app review cooldown (90 days)', () => {
  const now = new Date('2026-10-25T00:00:00Z');
  it('prompts when never asked', () => expect(canPromptReview(null, now)).toBe(true));
  it('does not prompt again after 89 days', () => expect(canPromptReview('2026-07-28T00:00:00Z', now)).toBe(false));
  it('prompts again after 90 days', () => expect(canPromptReview('2026-07-27T00:00:00Z', now)).toBe(true));
});
