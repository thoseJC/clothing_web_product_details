// cache-utility.js
class ProductCache {
    constructor() {
        this.cache = new Map();
        this.requestCount = 0;
        this.lastResetTime = Date.now();
        this.MAX_REQUESTS_PER_HOUR = 5;
        this.CACHE_DURATION = 12 * 60 * 1000; // 12 minutes in milliseconds
    }

    canMakeRequest() {
        // Reset counter if an hour has passed
        if (Date.now() - this.lastResetTime >= 3600000) {
            this.requestCount = 0;
            this.lastResetTime = Date.now();
        }
        return this.requestCount < this.MAX_REQUESTS_PER_HOUR;
    }

    incrementRequestCount() {
        this.requestCount++;
    }

    async get(key) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
            return cached.data;
        }
        return null;
    }

    set(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    clear() {
        this.cache.clear();
    }

    // Helper method to check cache status
    getStatus() {
        return {
            requestCount: this.requestCount,
            timeUntilReset: 3600000 - (Date.now() - this.lastResetTime),
            cacheSize: this.cache.size
        };
    }
}

// Export the ProductCache class
export { ProductCache };