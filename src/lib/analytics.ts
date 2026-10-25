import { supabase } from '@/integrations/supabase/client';

const DEVICE_KEY = 'gm_device_id';

export function getDeviceId(): string {
  try {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(DEVICE_KEY, id);
    }
    return id;
  } catch {
    return 'unknown';
  }
}

export type FunnelEvent =
  | 'app_open'
  | 'analysis_done'
  | 'paywall_view'
  | 'purchase_start'
  | 'arena_pick'
  | 'referral_share'
  | 'review_prompt';

/** Fire-and-forget funnel event. Never throws. */
export async function logEvent(event: FunnelEvent, props?: Record<string, unknown>) {
  try {
    const { data } = await supabase.auth.getSession();
    await supabase.from('app_events').insert({
      event,
      props: (props ?? null) as any,
      device_id: getDeviceId(),
      user_id: data.session?.user.id ?? null,
    });
  } catch {
    /* analytics must never break the app */
  }
}
