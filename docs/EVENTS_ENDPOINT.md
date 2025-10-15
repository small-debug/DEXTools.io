# Events Endpoint Documentation

## Overview

The `/events` endpoint provides access to processed swap events from the Qubic blockchain. This endpoint implements a sophisticated two-step process:

1. **Data Collection**: Continuously collects and processes transaction data from active addresses
2. **Data Serving**: Serves the processed events data via REST API

## Endpoint

### GET /api/v1/events

Retrieves swap events that occurred in a specified range of blocks.

**URL**: `/api/v1/events`

**Method**: `GET`

**Parameters**:
| Name | Type | Required | Location | Description |
|------|------|----------|----------|-------------|
| fromBlock | integer | No | Query | Starting block number (inclusive) |
| toBlock | integer | No | Query | Ending block number (inclusive) |

**Example Requests**:
```bash
# Get all events
curl "http://localhost:3000/api/v1/events"

# Get events in specific block range
curl "http://localhost:3000/api/v1/events?fromBlock=1000&toBlock=2000"

# Get events from a specific block onwards
curl "http://localhost:3000/api/v1/events?fromBlock=5000"
```

## Response Format

### Success Response (200 OK)

```json
{
  "events": [
    {
      "block": {
        "blockNumber": 12345,
        "blockTimestamp": 1630000000
      },
      "txnId": "txn123abc",
      "txnIndex": 0,
      "eventIndex": 0,
      "maker": "ADDRESS123...",
      "pairId": "PAIRID123...",
      "eventType": "swap",
      "asset0In": "1000000",
      "asset1Out": "2000000",
      "reserves": {
        "asset0": "50000000",
        "asset1": "100000000"
      }
    }
  ],
  "total": 1000,
  "fromBlock": 1000,
  "toBlock": 2000
}
```

**Response Fields**:

| Field | Type | Description |
|-------|------|-------------|
| `events` | array | Array of event objects |
| `total` | integer | Total number of events returned |
| `fromBlock` | integer\|null | Starting block number (if specified) |
| `toBlock` | integer\|null | Ending block number (if specified) |

**Event Object Fields**:

| Field | Type | Description |
|-------|------|-------------|
| `block.blockNumber` | integer | Number of the block |
| `block.blockTimestamp` | integer | Timestamp (in seconds) the block was confirmed at |
| `txnId` | string | Hash of the transaction the event belongs to |
| `txnIndex` | integer | Index of the transaction the event belongs to |
| `eventIndex` | integer | Index of the event inside the block (unique per block) |
| `maker` | string | Address of the wallet who requested the transaction |
| `pairId` | string | Address of the pair involved in the transaction |
| `eventType` | string | Type of event (always "swap" for this endpoint) |
| `asset0In` | string | Number of tokens of asset0 (QUBIC) sold |
| `asset1Out` | string | Number of tokens of asset1 (token) bought |
| `reserves.asset0` | string | Reserves of token asset0 |
| `reserves.asset1` | string | Reserves of token asset1 |

### Error Responses

#### 400 Bad Request
Invalid parameters:
```json
{
  "success": false,
  "error": "Invalid fromBlock parameter. Must be a non-negative integer.",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### 500 Internal Server Error
Server error:
```json
{
  "success": false,
  "error": "Failed to fetch events: Error message",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Data Collection Process

The events endpoint uses a sophisticated two-step data collection process:

### Step 1: Data Collection

#### 1.1 Active Address Discovery
- **Source**: [Qubic RPC API](https://rpc.qubic.org/v1/latest-stats) and [Rich List API](https://rpc.qubic.org/v1/rich-list)
- **Method**: `GET /latest-stats` and `GET /rich-list` with pagination
- **Purpose**: Identifies all active addresses on the Qubic network

#### 1.2 Transaction Fetching
- **Source**: [Qubic RPC Archive Service](https://qubic.github.io/integration/Partners/swagger/qubic-rpc-doc.html#/ArchiveService/ArchiveService_GetIdentityTransfersInTickRangeV2)
- **Method**: `GET /identities/{address}/transfers-in-tick-range-v2`
- **Parameters**:
  - `startTick`: Previous processed tick for the address
  - `endTick`: Latest tick from [GetLatestTick](https://qubic.github.io/integration/Partners/swagger/qubic-rpc-doc.html#/ArchiveService/ArchiveService_GetLatestTick)

#### 1.3 Smart Contract Querying
- **Source**: [Qubic Live Tree Service](https://qubic.github.io/integration/Partners/swagger/qubic-rpc-doc.html?urls.primaryName=Qubic%20RPC%20Live%20Tree#/QubicLiveService/QubicLiveService_QuerySmartContract)
- **Method**: `POST /query-smart-contract`
- **Purpose**: Retrieves reserves data for each pair
- **Parameters**:
  - `contractIndex`: 1
  - `inputType`: 2
  - `inputSize`: 48
  - `requestData`: Base64 encoded `AssetAskOrders_input` struct

#### 1.4 Data Processing
- **Filtering**: Identifies swap transactions (transfers to QX address with specific patterns)
- **Extraction**: Parses transaction data to extract:
  - `pairId`: Token issuer from `inputHex`
  - `asset0In`: QUBIC amount from transaction
  - `asset1Out`: Token amount from `inputHex`
  - `reserves`: Aggregated from smart contract queries

#### 1.5 Cycling Mechanism
- **Frequency**: Every 5 minutes
- **Process**: 
  1. Get latest tick
  2. Fetch new active addresses
  3. Process transactions for all addresses
  4. Update state and save data

### Step 2: Data Serving

The processed events are stored in a JSON file and served via the REST API with filtering capabilities.

## Configuration

### Environment Variables

Add to your `.env` file:

```env
# Qubic RPC Configuration
QUBIC_RPC_URL=https://rpc.qubic.org/v1
QUBIC_RPC_TIMEOUT=30000


# Qubic Live Tree API Configuration
QUBIC_LIVE_TREE_URL=https://live.qubic.org/v1

# Events Data Collection Configuration
ENABLE_EVENTS_COLLECTION=true
```

### Data Storage

- **Events Data**: `data/events.json`
- **Collection State**: `data/collection-state.json`
- **Automatic Cleanup**: Duplicate events are automatically removed

## Monitoring

### Status Endpoint

Monitor the data collection system:

```bash
curl "http://localhost:3000/api/v1/events/status"
```

**Response**:
```json
{
  "success": true,
  "status": {
    "isInitialized": true,
    "isCollecting": true,
    "collector": {
      "isCollecting": true,
      "lastCollectionTime": "2024-01-01T12:00:00.000Z",
      "latestTick": 34500000,
      "activeAddressesCount": 150
    }
  },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## Implementation Details

### Data Collection Service

The `EventsDataCollector` class handles:

1. **Initialization**: Sets up data directories and state
2. **Address Management**: Discovers and tracks active addresses
3. **Transaction Processing**: Fetches and processes transactions
4. **Smart Contract Integration**: Queries reserves data
5. **Data Persistence**: Saves processed events to file
6. **State Management**: Tracks collection progress

### Smart Contract Integration

The system queries Qubic smart contracts to get reserves data:

```javascript
// AssetAskOrders_input struct encoding
{
  id: issuer,        // 32 bytes
  assetName: name,  // 8 bytes  
  offset: offset    // 8 bytes
}
```

### Error Handling

- **Network Errors**: Automatic retry with exponential backoff
- **Data Validation**: Comprehensive input validation
- **State Recovery**: Automatic state recovery on restart
- **Graceful Degradation**: Continues operation even if some addresses fail

## Performance Considerations

### Optimization Strategies

1. **Incremental Processing**: Only processes new transactions since last run
2. **Parallel Processing**: Processes multiple addresses concurrently
3. **Data Deduplication**: Removes duplicate events automatically
4. **Efficient Storage**: JSON format for fast access and processing

### Resource Usage

- **Memory**: Minimal memory footprint with streaming processing
- **Storage**: Compressed JSON storage with automatic cleanup
- **Network**: Efficient API calls with proper timeout handling
- **CPU**: Background processing with minimal impact on API performance

## Troubleshooting

### Common Issues

#### 1. No Events Returned
**Cause**: Data collection not started or no swap transactions found
**Solution**: 
- Check status endpoint: `GET /api/v1/events/status`
- Verify `ENABLE_EVENTS_COLLECTION=true` in environment
- Wait for data collection cycle to complete

#### 2. Collection Errors
**Cause**: Network issues or API rate limits
**Solution**:
- Check Qubic RPC connectivity
- Verify API endpoints are accessible
- Review error logs for specific issues

#### 3. Missing Reserves Data
**Cause**: Smart contract query failures
**Solution**:
- Verify Live Tree API accessibility
- Check contract encoding implementation
- Review transaction input parsing logic

### Debugging

Enable detailed logging by setting:
```env
NODE_ENV=development
```

## Testing

### Run Tests

```bash
# Test events endpoint
npm run test:events

# Test all endpoints
npm test
```

### Manual Testing

```bash
# Test basic functionality
curl "http://localhost:3000/api/v1/events"

# Test with parameters
curl "http://localhost:3000/api/v1/events?fromBlock=1000&toBlock=2000"

# Test status
curl "http://localhost:3000/api/v1/events/status"
```

## API References

- [Qubic Stats API](https://qubic.github.io/integration/Partners/swagger/qubic-rpc-doc.html?urls.primaryName=Qubic%20Stats%20API)
- [Qubic RPC Archive Service](https://qubic.github.io/integration/Partners/swagger/qubic-rpc-doc.html#/ArchiveService)
- [Qubic Live Tree Service](https://qubic.github.io/integration/Partners/swagger/qubic-rpc-doc.html?urls.primaryName=Qubic%20RPC%20Live%20Tree)

## Notes

- **Event Types**: Currently only supports "swap" events
- **Data Freshness**: Events are updated every 5 minutes
- **Block Range**: Large block ranges may return many events
- **Reserves Accuracy**: Reserves data depends on smart contract query success
- **Address Discovery**: Active addresses are refreshed on each cycle

## Future Enhancements

Potential improvements:
1. **Additional Event Types**: Support for creation, join, exit events
2. **Real-time Updates**: WebSocket support for live event streaming
3. **Advanced Filtering**: Filter by pair, maker, or event type
4. **Pagination**: Support for large result sets
5. **Caching**: Redis integration for improved performance
6. **Analytics**: Built-in analytics and reporting features
