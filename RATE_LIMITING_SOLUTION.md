# Rate Limiting Solution for DEXTools Qubic API

## Problem
The DEXTools API was receiving "Too many requests" (429) errors when calling the external Qubic RPC API at `http://67.222.157.73:3000/api/v1/events`.

## Solution Implemented

### 1. Client-Side Rate Limiting
- **Rate Limit**: Maximum 10 requests per second to external API
- **Configurable**: Set via `QUBIC_RPC_RATE_LIMIT` environment variable
- **Window-based**: Resets every second

### 2. Exponential Backoff Retry
- **Max Retries**: 3 attempts (configurable via `QUBIC_RPC_MAX_RETRIES`)
- **Base Delay**: 1000ms (configurable via `QUBIC_RPC_RETRY_DELAY`)
- **Exponential**: Delay doubles with each retry (1s, 2s, 4s)

### 3. Circuit Breaker Pattern
- **Threshold**: Opens after 5 consecutive failures (configurable via `QUBIC_RPC_CIRCUIT_THRESHOLD`)
- **Timeout**: 30 seconds before attempting half-open (configurable via `QUBIC_RPC_CIRCUIT_TIMEOUT`)
- **States**: CLOSED → OPEN → HALF_OPEN → CLOSED

### 4. Request Queuing
- **Serialization**: All API requests are serialized through `makeRateLimitedRequest()`
- **Automatic**: No manual queue management needed

## Configuration

Add these environment variables to your `.env` file:

```bash
# Rate Limiting Configuration
QUBIC_RPC_RATE_LIMIT=10          # Max requests per second
QUBIC_RPC_MAX_RETRIES=3          # Max retry attempts
QUBIC_RPC_RETRY_DELAY=1000      # Base delay in milliseconds
QUBIC_RPC_CIRCUIT_THRESHOLD=5   # Failures before circuit opens
QUBIC_RPC_CIRCUIT_TIMEOUT=30000 # Circuit timeout in milliseconds
```

## How It Works

1. **Request Flow**:
   ```
   Client Request → Rate Limit Check → Circuit Breaker Check → API Call → Success/Failure
   ```

2. **On 429 Error**:
   ```
   429 Error → Exponential Backoff → Retry → Success or Max Retries Reached
   ```

3. **Circuit Breaker**:
   ```
   Failures ≥ Threshold → Circuit Opens → Wait Timeout → Half-Open Test → Closed
   ```

## Benefits

- **Prevents API Overload**: Limits requests to external API
- **Automatic Recovery**: Retries with exponential backoff
- **Fault Tolerance**: Circuit breaker prevents cascade failures
- **Configurable**: Easy to adjust limits based on API capacity
- **Transparent**: No changes needed to existing API endpoints

## Monitoring

The system logs important events:
- `⏳ Rate limit reached, waiting Xms`
- `🔄 Rate limited, retrying in Xms (attempt Y/Z)`
- `🚨 Circuit breaker opened due to X consecutive failures`
- `✅ Circuit breaker moved to CLOSED state`

## Testing

To test the rate limiting:

```bash
# Make multiple rapid requests
for i in {1..20}; do
  curl "http://localhost:3000/api/v1/events?fromBlock=34823331&toBlock=34824450" &
done
```

The system will automatically handle rate limiting and retries.
