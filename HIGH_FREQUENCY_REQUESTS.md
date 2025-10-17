# High-Frequency Request Handling

This document describes the optimizations implemented to handle high-frequency sequential requests to the `/latest-block` and `/events` endpoints for real-time blockchain data streaming.

## 🚀 **Optimization Features**

### 1. **Rate Limiting**
- **Blockchain Endpoints**: 100 requests/second per IP for `/latest-block` and `/events`
- **General Endpoints**: 1000 requests per 15 minutes per IP for other endpoints
- **Localhost Bypass**: Rate limiting is disabled for localhost during development

### 2. **Intelligent Caching**
- **Latest Block Cache**: 5-second cache for latest block data
- **Empty Range Cache**: Caches empty block ranges for 5 seconds to avoid redundant RPC calls
- **Cache Statistics**: Monitor cache performance via `/api/v1/cache-stats`

### 3. **Fast Response Optimization**
- **Empty Range Detection**: Immediately returns empty events array for known empty ranges
- **Cached Responses**: Returns cached data when available (sub-50ms response times)
- **Smart Caching**: Only caches empty ranges, not ranges with transactions

### 4. **Request Monitoring**
- **Performance Logging**: Tracks response times for blockchain endpoints
- **Fast Response Detection**: Logs when responses are very fast (likely cached)
- **IP Tracking**: Monitors request patterns per IP address

## 📊 **API Endpoints**

### Core Endpoints
- `GET /api/v1/latest-block` - Get latest block (cached, rate limited)
- `GET /api/v1/events?fromBlock=X&toBlock=Y` - Get events in range (cached, rate limited)

### Monitoring Endpoints
- `GET /api/v1/cache-stats` - Get cache statistics
- `POST /api/v1/clear-cache` - Clear all caches (maintenance)

## 🔄 **Request Flow**

### Sequential Request Pattern
```
1. GET /latest-block → Returns latest block number
2. GET /events?fromBlock=lastBlock&toBlock=currentBlock → Returns events
3. Repeat with next block range
```

### Caching Strategy
```
1. Check cache for latest block (5s TTL)
2. Check cache for empty range (5s TTL)
3. If cached: Return immediately (< 50ms)
4. If not cached: Fetch from RPC, cache result
5. If empty range: Cache for future requests
```

## ⚡ **Performance Characteristics**

### Expected Response Times
- **Cached Latest Block**: < 50ms
- **Cached Empty Range**: < 50ms
- **Fresh RPC Call**: 200-1000ms (depending on network)
- **Empty Range (first time)**: 200-1000ms, then cached

### Rate Limits
- **Maximum**: 100 requests/second per IP
- **Typical Usage**: 1-10 requests/second for sequential polling
- **Burst Handling**: Graceful degradation with rate limit headers

## 🛠 **Configuration**

### Environment Variables
```bash
# Rate limiting (optional)
RATE_LIMIT_WINDOW_MS=1000
RATE_LIMIT_MAX_REQUESTS=100

# Cache settings (optional)
CACHE_TIMEOUT_MS=5000
CACHE_MAX_SIZE=1000
```

### Cache Settings
- **Timeout**: 5 seconds (configurable)
- **Max Size**: 1000 cached ranges (configurable)
- **Cleanup**: Automatic cleanup of expired entries

## 📈 **Monitoring**

### Cache Statistics
```json
{
  "success": true,
  "data": {
    "emptyRangesCount": 45,
    "hasLatestBlockCache": true,
    "latestBlockAge": 1234
  }
}
```

### Request Logs
```
🚀 GET /api/v1/latest-block - 200 - 23ms - IP: 127.0.0.1
⚡ Fast response (23ms) - likely cached
🚀 GET /api/v1/events - 200 - 15ms - IP: 127.0.0.1
⚡ Fast response (15ms) - likely cached
```

## 🔧 **Maintenance**

### Clear Cache
```bash
curl -X POST http://localhost:3000/api/v1/clear-cache
```

### Monitor Performance
```bash
curl http://localhost:3000/api/v1/cache-stats
```

## 🚨 **Error Handling**

### Rate Limit Exceeded
```json
{
  "success": false,
  "error": "Too many requests, please slow down",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Graceful Degradation
- Rate limiting prevents server overload
- Caching reduces RPC load
- Fast responses for empty ranges
- Automatic cache cleanup

## 🎯 **Best Practices**

1. **Sequential Requests**: Always call `/latest-block` then `/events`
2. **Appropriate Ranges**: Use reasonable block ranges (not too large)
3. **Error Handling**: Implement retry logic with exponential backoff
4. **Monitoring**: Check cache stats regularly for performance insights
5. **Rate Limiting**: Respect rate limits to avoid throttling

This implementation ensures your real-time blockchain data streaming can handle high-frequency requests efficiently while maintaining good performance and preventing server overload.
