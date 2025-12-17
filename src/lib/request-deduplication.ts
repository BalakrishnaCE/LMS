// Request deduplication utility to prevent duplicate API calls
interface PendingRequest {
  promise: Promise<any>;
  timestamp: number;
}

class RequestDeduplication {
  private pendingRequests = new Map<string, PendingRequest>();
  private defaultTTL = 30000; // 30 seconds default

  deduplicate<T>(
    method: string,
    params: any,
    requestFunction: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const key = this.generateKey(method, params);
    const now = Date.now();
    const requestTTL = ttl || this.defaultTTL;

    // Check if there's a pending request
    const pending = this.pendingRequests.get(key);
    if (pending && (now - pending.timestamp) < requestTTL) {
      return pending.promise;
    }

    // Create new request
    const promise = requestFunction().finally(() => {
      this.pendingRequests.delete(key);
    });

    this.pendingRequests.set(key, {
      promise,
      timestamp: now
    });

    return promise;
  }

  private generateKey(method: string, params: any): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}:${JSON.stringify(params[key])}`)
      .join('|');
    return `${method}:${sortedParams}`;
  }

  clear(): void {
    this.pendingRequests.clear();
  }

  getStats() {
    return {
      pendingRequests: this.pendingRequests.size
    };
  }
}

export const requestDeduplication = new RequestDeduplication();
