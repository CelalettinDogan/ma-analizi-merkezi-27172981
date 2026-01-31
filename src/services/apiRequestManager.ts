import { supabase } from '@/integrations/supabase/client';

/**
 * Centralized API Request Manager to prevent 429 rate limit errors
 * Football-Data.org free tier: 10 requests per minute
 */

interface CacheEntry {
  data: unknown;
  timestamp: number;
}

interface QueuedRequest {
  body: Record<string, unknown>;
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
  retryCount: number;
}

// Cache configuration
const cache = new Map<string, CacheEntry>();
const CACHE_DURATIONS = {
  live: 2 * 60 * 1000,      // 2 minutes for live matches
  matches: 5 * 60 * 1000,   // 5 minutes for scheduled matches
  standings: 6 * 60 * 60 * 1000, // 6 hours for standings
  teams: 24 * 60 * 60 * 1000, // 24 hours for teams
  head2head: 60 * 60 * 1000,  // 1 hour for h2h
  default: 10 * 60 * 1000,    // 10 minutes default
};

// Rate limiting configuration
const REQUEST_INTERVAL = 7000; // 7 seconds between requests (safe margin for 10 req/min)
const MAX_RETRIES = 2;
const RETRY_JITTER_MS = 500; // small buffer to avoid retrying exactly at reset boundary

// Queue state
let requestQueue: QueuedRequest[] = [];
let isProcessingQueue = false;
let lastRequestTime = 0;

function getCacheKey(body: Record<string, unknown>): string {
  return JSON.stringify(body);
}

function getCacheDuration(action: string): number {
  return CACHE_DURATIONS[action as keyof typeof CACHE_DURATIONS] || CACHE_DURATIONS.default;
}

function getCached<T>(key: string, duration: number): T | null {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.timestamp < duration) {
    console.log(`[API Cache HIT] ${key.substring(0, 50)}...`);
    return entry.data as T;
  }
  return null;
}

function setCache(key: string, data: unknown): void {
  cache.set(key, { data, timestamp: Date.now() });
}

async function waitForRateLimit(): Promise<void> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < REQUEST_INTERVAL) {
    const waitTime = REQUEST_INTERVAL - timeSinceLastRequest;
    console.log(`[Rate Limit] Waiting ${waitTime}ms before next request`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  lastRequestTime = Date.now();
}

function extractRetryAfterSeconds(message: string): number | null {
  // supabase-js error message often contains the function response JSON for 429s
  // Example: Edge function returned 429: Error, {"error":"Rate limit exceeded","retryAfter":19,...}
  const match = message.match(/"retryAfter"\s*:\s*(\d+)/);
  if (match?.[1]) return parseInt(match[1], 10);
  return null;
}

async function executeRequest(body: Record<string, unknown>): Promise<unknown> {
  const { data, error } = await supabase.functions.invoke('football-api', {
    body,
  });

  if (error) {
    const message = (error as unknown as { message?: string })?.message || 'API çağrısı başarısız';

    // When the function returns a non-2xx (e.g., 429), supabase-js surfaces it as `error`
    // so we need to interpret it here to trigger our backoff/retry logic.
    if (message.includes('returned 429')) {
      const retryAfter = extractRetryAfterSeconds(message) ?? 15;
      throw new Error(`RATE_LIMIT:${retryAfter}`);
    }

    throw new Error(message);
  }

  // If the function responds with 200 but includes a rate-limit payload (defensive)
  if (data?.error?.includes?.('Rate limit') || data?.retryAfter) {
    const retryAfter = data.retryAfter || 10;
    throw new Error(`RATE_LIMIT:${retryAfter}`);
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return data;
}

async function processQueue(): Promise<void> {
  if (isProcessingQueue || requestQueue.length === 0) return;
  
  isProcessingQueue = true;
  
  while (requestQueue.length > 0) {
    const request = requestQueue.shift();
    if (!request) continue;

    try {
      await waitForRateLimit();
      const data = await executeRequest(request.body);
      
      // Cache successful response
      const cacheKey = getCacheKey(request.body);
      setCache(cacheKey, data);
      
      request.resolve(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Handle rate limit errors with retry
      if (errorMessage.startsWith('RATE_LIMIT:')) {
        const retryAfter = parseInt(errorMessage.split(':')[1]) || 10;
        
        if (request.retryCount < MAX_RETRIES) {
          console.log(`[Rate Limited] Retrying in ${retryAfter}s (attempt ${request.retryCount + 1}/${MAX_RETRIES})`);
          
          // Wait for the retry-after period (+ small jitter)
          await new Promise(resolve => setTimeout(resolve, retryAfter * 1000 + RETRY_JITTER_MS));
          
          // Re-queue with incremented retry count
          requestQueue.unshift({ ...request, retryCount: request.retryCount + 1 });
        } else {
          // Max retries reached, try to return cached data
          const cacheKey = getCacheKey(request.body);
          const cached = cache.get(cacheKey);
          if (cached) {
            console.log('[Rate Limited] Returning stale cache after max retries');
            request.resolve(cached.data);
          } else {
            request.reject(new Error('API rate limit exceeded. Lütfen biraz bekleyip tekrar deneyin.'));
          }
        }
      } else {
        request.reject(error instanceof Error ? error : new Error(errorMessage));
      }
    }
  }
  
  isProcessingQueue = false;
}

/**
 * Main function to call Football API with rate limiting and caching
 */
export async function footballApiRequest<T>(body: Record<string, unknown>): Promise<T> {
  const cacheKey = getCacheKey(body);
  const action = body.action as string;
  const cacheDuration = getCacheDuration(action);
  
  // Check cache first
  const cached = getCached<T>(cacheKey, cacheDuration);
  if (cached !== null) {
    return cached;
  }

  // Queue the request
  return new Promise((resolve, reject) => {
    requestQueue.push({
      body,
      resolve: resolve as (value: unknown) => void,
      reject,
      retryCount: 0,
    });
    
    // Start processing if not already
    processQueue();
  });
}

/**
 * Check if we have cached data for a request
 */
export function hasCachedData(body: Record<string, unknown>): boolean {
  const cacheKey = getCacheKey(body);
  const action = body.action as string;
  const cacheDuration = getCacheDuration(action);
  return getCached(cacheKey, cacheDuration) !== null;
}

/**
 * Get queue status for debugging
 */
export function getQueueStatus(): { pending: number; isProcessing: boolean } {
  return {
    pending: requestQueue.length,
    isProcessing: isProcessingQueue,
  };
}

/**
 * Clear the cache (useful for debugging)
 */
export function clearCache(): void {
  cache.clear();
  console.log('[API Cache] Cleared');
}
