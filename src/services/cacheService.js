class CacheService {
  constructor() {
    this.emptyRanges = new Map(); // Cache for empty block ranges
    this.latestBlockCache = null; // Cache for latest block
    this.cacheTimeout = 5000; // 5 seconds cache timeout
    this.maxCacheSize = 1000; // Maximum number of cached ranges
  }

  /**
   * Check if a block range is known to be empty
   * @param {number} fromBlock - Start block number
   * @param {number} toBlock - End block number
   * @returns {boolean} True if range is cached as empty
   */
  isEmptyRange(fromBlock, toBlock) {
    const key = `${fromBlock}-${toBlock}`;
    const cached = this.emptyRanges.get(key);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return true;
    }
    
    // Clean up expired entries
    if (cached) {
      this.emptyRanges.delete(key);
    }
    
    return false;
  }

  /**
   * Cache an empty block range
   * @param {number} fromBlock - Start block number
   * @param {number} toBlock - End block number
   */
  cacheEmptyRange(fromBlock, toBlock) {
    const key = `${fromBlock}-${toBlock}`;
    
    // Clean up old entries if cache is full
    if (this.emptyRanges.size >= this.maxCacheSize) {
      const oldestKey = this.emptyRanges.keys().next().value;
      this.emptyRanges.delete(oldestKey);
    }
    
    this.emptyRanges.set(key, {
      timestamp: Date.now(),
      fromBlock,
      toBlock
    });
  }

  /**
   * Get cached latest block if still valid
   * @returns {Object|null} Cached latest block or null
   */
  getCachedLatestBlock() {
    if (this.latestBlockCache && Date.now() - this.latestBlockCache.timestamp < this.cacheTimeout) {
      return this.latestBlockCache.data;
    }
    return null;
  }

  /**
   * Cache latest block data
   * @param {Object} blockData - Latest block data
   */
  cacheLatestBlock(blockData) {
    this.latestBlockCache = {
      data: blockData,
      timestamp: Date.now()
    };
  }

  /**
   * Clear all caches
   */
  clearCache() {
    this.emptyRanges.clear();
    this.latestBlockCache = null;
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getStats() {
    return {
      emptyRangesCount: this.emptyRanges.size,
      hasLatestBlockCache: !!this.latestBlockCache,
      latestBlockAge: this.latestBlockCache ? Date.now() - this.latestBlockCache.timestamp : null
    };
  }
}

module.exports = CacheService;
