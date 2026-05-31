import { notification } from 'antd';

export interface RateLimiterConfig {
  maxRequests: number;
  windowMs: number;
  key?: string;
}

interface RateLimitState {
  requests: number[];
  timestamp: number;
}

export class RateLimiter {
  private requests: number[] = [];
  private config: RateLimiterConfig;
  private storageKey: string;

  constructor(config: RateLimiterConfig) {
    this.config = config;
    this.storageKey = `rate_limiter_${config.key || 'default'}`;
    this.loadFromStorage();
  }

  canMakeRequest(): { allowed: boolean; remaining: number; resetIn: number } {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    this.requests = this.requests.filter(time => time > windowStart);

    const remaining = this.config.maxRequests - this.requests.length;
    const oldestRequest = this.requests[0];
    const resetIn = oldestRequest
      ? Math.max(0, oldestRequest - windowStart)
      : 0;

    return {
      allowed: remaining > 0,
      remaining: Math.max(0, remaining),
      resetIn,
    };
  }

  recordRequest(): void {
    this.requests.push(Date.now());
    this.saveToStorage();
  }

  async waitForSlot(maxWaitMs = 60000): Promise<boolean> {
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitMs) {
      const { allowed, resetIn } = this.canMakeRequest();

      if (allowed) {
        return true;
      }

      await new Promise((resolve) => setTimeout(resolve, Math.min(resetIn + 100, 1000)));
    }

    return false;
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const data: RateLimitState = JSON.parse(stored);
        if (Date.now() - data.timestamp < this.config.windowMs) {
          this.requests = data.requests;
        }
      }
    } catch {
      // Ignore localStorage errors
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(
        this.storageKey,
        JSON.stringify({
          requests: this.requests,
          timestamp: Date.now(),
        })
      );
    } catch {
      // Ignore localStorage errors
    }
  }

  reset(): void {
    this.requests = [];
    localStorage.removeItem(this.storageKey);
  }
}

// Pre-configured rate limiters for different API endpoints
export const rateLimiters = {
  api: new RateLimiter({
    key: 'api',
    maxRequests: 60,
    windowMs: 60 * 1000, // 60 requests per minute
  }),

  upload: new RateLimiter({
    key: 'upload',
    maxRequests: 5,
    windowMs: 80 * 1000, // 5 uploads per minute
  }),

  chat: new RateLimiter({
    key: 'chat',
    maxRequests: 20,
    windowMs: 60 * 1000, // 20 chat messages per minute
  }),

  generation: new RateLimiter({
    key: 'generation',
    maxRequests: 3,
    windowMs: 60 * 1000, // 3 image generations per minute
  }),
};

// Hook for React components
export function useRateLimit(limiter: RateLimiter) {
  const checkLimit = () => {
    const status = limiter.canMakeRequest();

    if (!status.allowed) {
      notification.warning({
        message: 'Rate Limit Reached',
        description: `Vui lòng chờ ${Math.ceil(status.resetIn / 1000)}s trước khi thử lại.`,
        duration: 5,
      });
    }

    return status;
  };

  const executeWithLimit = async <T>(fn: () => Promise<T>): Promise<T | null> => {
    const status = checkLimit();

    if (!status.allowed) {
      return null;
    }

    limiter.recordRequest();

    try {
      return await fn();
    } catch (error) {
      throw error;
    }
  };

  return {
    checkLimit,
    executeWithLimit,
    remaining: limiter.canMakeRequest().remaining,
  };
}

export default RateLimiter;
