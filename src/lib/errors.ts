/**
 * Custom application error class for standardized error handling
 */
export class AppError extends Error {
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    code: string = 'UNKNOWN_ERROR',
    isOperational: boolean = true,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.isOperational = isOperational;
    this.details = details;

    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace?.(this, this.constructor);
  }
}

// Error codes
export const ERROR_CODES = {
  // Network errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
  
  // Authentication errors
  AUTH_ERROR: 'AUTH_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  
  // Database errors
  DB_ERROR: 'DB_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
  
  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  
  // API errors
  API_ERROR: 'API_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  
  // General errors
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];

// User-friendly error messages (Turkish)
export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  [ERROR_CODES.NETWORK_ERROR]: 'Bağlantı hatası oluştu. İnternet bağlantınızı kontrol edin.',
  [ERROR_CODES.TIMEOUT_ERROR]: 'İstek zaman aşımına uğradı. Lütfen tekrar deneyin.',
  [ERROR_CODES.RATE_LIMIT_ERROR]: 'Çok fazla istek gönderildi. Lütfen bir süre bekleyin.',
  [ERROR_CODES.AUTH_ERROR]: 'Kimlik doğrulama hatası oluştu.',
  [ERROR_CODES.UNAUTHORIZED]: 'Bu işlem için giriş yapmanız gerekiyor.',
  [ERROR_CODES.SESSION_EXPIRED]: 'Oturumunuz sona erdi. Lütfen tekrar giriş yapın.',
  [ERROR_CODES.DB_ERROR]: 'Veritabanı hatası oluştu.',
  [ERROR_CODES.NOT_FOUND]: 'Aradığınız kayıt bulunamadı.',
  [ERROR_CODES.DUPLICATE_ENTRY]: 'Bu kayıt zaten mevcut.',
  [ERROR_CODES.VALIDATION_ERROR]: 'Girdiğiniz bilgiler geçersiz.',
  [ERROR_CODES.INVALID_INPUT]: 'Geçersiz giriş.',
  [ERROR_CODES.API_ERROR]: 'Bir hata oluştu. Lütfen tekrar deneyin.',
  [ERROR_CODES.EXTERNAL_SERVICE_ERROR]: 'Dış servis hatası oluştu.',
  [ERROR_CODES.UNKNOWN_ERROR]: 'Beklenmeyen bir hata oluştu.',
};

/**
 * Gets user-friendly error message from error code
 */
export function getErrorMessage(code: ErrorCode): string {
  return ERROR_MESSAGES[code] || ERROR_MESSAGES[ERROR_CODES.UNKNOWN_ERROR];
}

/**
 * Extracts error code from various error types
 */
export function extractErrorCode(error: unknown): ErrorCode {
  if (error instanceof AppError) {
    return error.code as ErrorCode;
  }
  
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch')) {
      return ERROR_CODES.NETWORK_ERROR;
    }
    if (message.includes('timeout')) {
      return ERROR_CODES.TIMEOUT_ERROR;
    }
    if (message.includes('429') || message.includes('rate limit')) {
      return ERROR_CODES.RATE_LIMIT_ERROR;
    }
    if (message.includes('auth') || message.includes('unauthorized')) {
      return ERROR_CODES.AUTH_ERROR;
    }
    if (message.includes('not found') || message.includes('404')) {
      return ERROR_CODES.NOT_FOUND;
    }
  }
  
  return ERROR_CODES.UNKNOWN_ERROR;
}

/**
 * Handles error and returns user-friendly message
 */
export function handleError(error: unknown): { code: ErrorCode; message: string } {
  const code = extractErrorCode(error);
  const message = getErrorMessage(code);
  
  // Log the actual error for debugging
  console.error('Error occurred:', {
    code,
    error: error instanceof Error ? error.message : error,
    stack: error instanceof Error ? error.stack : undefined,
  });
  
  return { code, message };
}
