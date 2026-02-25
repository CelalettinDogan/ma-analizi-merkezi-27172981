import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { CONFIDENCE_THRESHOLDS } from "@/constants/predictions";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Returns the appropriate color class based on confidence value
 * @param value - Confidence percentage (0-100)
 * @returns Tailwind color class
 */
export function getConfidenceColor(value: number): string {
  if (value >= CONFIDENCE_THRESHOLDS.HIGH) return 'text-emerald-400';
  if (value >= CONFIDENCE_THRESHOLDS.MEDIUM) return 'text-amber-400';
  return 'text-muted-foreground';
}

/**
 * Returns the appropriate background color class based on confidence value
 * @param value - Confidence percentage (0-100)
 * @returns Tailwind background color class
 */
export function getConfidenceBgColor(value: number): string {
  if (value >= CONFIDENCE_THRESHOLDS.HIGH) return 'bg-emerald-500/20';
  if (value >= CONFIDENCE_THRESHOLDS.MEDIUM) return 'bg-amber-500/20';
  return 'bg-muted/50';
}

/**
 * Returns the appropriate border color class based on confidence value
 * @param value - Confidence percentage (0-100)
 * @returns Tailwind border color class
 */
export function getConfidenceBorderColor(value: number): string {
  if (value >= CONFIDENCE_THRESHOLDS.HIGH) return 'border-emerald-500/30';
  if (value >= CONFIDENCE_THRESHOLDS.MEDIUM) return 'border-amber-500/30';
  return 'border-border';
}

/**
 * Converts confidence level string to numeric value
 * @param confidence - Confidence level string (düşük, orta, yüksek)
 * @returns Numeric confidence value (0-100)
 */
export function confidenceToNumber(confidence: string): number {
  const lowerConfidence = confidence.toLowerCase();
  if (lowerConfidence.includes('yüksek') || lowerConfidence.includes('high')) return 75;
  if (lowerConfidence.includes('orta') || lowerConfidence.includes('medium')) return 55;
  return 35;
}

/**
 * Formats a date string for display
 * @param dateString - ISO date string
 * @param locale - Locale for formatting (default: tr-TR)
 * @returns Formatted date string
 */
export function formatMatchDate(dateString: string, locale: string = 'tr-TR'): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

/**
 * Formats a date string for time display
 * @param dateString - ISO date string
 * @returns Formatted time string (HH:MM)
 */
export function formatMatchTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

/**
 * Truncates text to a maximum length with ellipsis
 * @param text - Text to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated text
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

/**
 * Safely parses JSON with fallback
 * @param json - JSON string to parse
 * @param fallback - Fallback value if parsing fails
 * @returns Parsed value or fallback
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

/**
 * Generates a unique ID for client-side use
 * @returns Unique string ID
 */
export function generateClientId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Debounces a function call
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Calculates hybrid confidence from AI and math confidence values.
 * Returns a percentage (0-100).
 * Falls back to string-based confidence if no numerical values exist.
 * @param prediction - Object with optional aiConfidence, mathConfidence, and confidence fields
 * @returns Hybrid confidence percentage (0-100)
 */
export function getHybridConfidence(prediction: {
  aiConfidence?: number;
  mathConfidence?: number;
  confidence?: string;
}): number {
  const ai = prediction.aiConfidence || 0;
  const math = prediction.mathConfidence || 0;
  
  // If we have at least one numerical confidence, compute hybrid
  if (ai > 0 || math > 0) {
    const count = (ai > 0 ? 1 : 0) + (math > 0 ? 1 : 0);
    return ((ai + math) / count) * 100;
  }
  
  // Fallback to string-based confidence
  return confidenceToNumber(prediction.confidence || 'düşük');
}

/**
 * Returns the confidence level string based on a percentage value.
 * @param percentage - Confidence percentage (0-100)
 * @returns Confidence level string
 */
export function getConfidenceLevel(percentage: number): 'yüksek' | 'orta' | 'düşük' {
  if (percentage >= CONFIDENCE_THRESHOLDS.HIGH) return 'yüksek';
  if (percentage >= CONFIDENCE_THRESHOLDS.MEDIUM) return 'orta';
  return 'düşük';
}
