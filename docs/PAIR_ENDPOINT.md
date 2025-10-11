# Pair Endpoint Documentation

## Overview

The `/pair` endpoint retrieves pair (pool) details by its address from the Qubic blockchain. This endpoint is part of the DEXTools integration API for Qubic.

## Endpoint

### GET /api/v1/pair

Retrieves pair details by its address using a query parameter.

**URL**: `/api/v1/pair?id={pairAddress}`

**Method**: `GET`

**Parameters**:
| Name | Type | Required | Location | Description |
|------|------|----------|----------|-------------|
| id | string | Yes | Query | The pair address (identity) |

**Example Request**:
```bash
curl "http://localhost:3000/api/v1/pair?id=PAIRADDRESSEXAMPLE"
```

### GET /api/v1/pair/:pairId

Alternative endpoint using path parameter.

**URL**: `/api/v1/pair/{pairAddress}`

**Method**: `GET`

**Parameters**:
| Name | Type | Required | Location | Description |
|------|------|----------|----------|-------------|
| pairId | string | Yes | Path | The pair address (identity) |

**Example Request**:
```bash
curl "http://localhost:3000/api/v1/pair/PAIRADDRESSEXAMPLE"
```

## Response Format

### Success Response (200 OK)

```json
{
  "pair": {
    "id": "string",
    "asset0Id": "string",
    "asset1Id": "string",
    "createdAtBlockNumber": 0,
    "createdAtBlockTimestamp": 0,
    "createdAtTxnId": "string",
    "factoryAddress": "string"
  }
}
```

**Response Fields**:

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Address of the pair (same as the input parameter) |
| `asset0Id` | string | Address of the first token (always null address: `AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFXIB`) |
| `asset1Id` | string | Address of the second token (same as the input parameter) |
| `createdAtBlockNumber` | integer | Number of block (tick) the pair was created at |
| `createdAtBlockTimestamp` | integer | Timestamp (in seconds) of the block the pair was created at |
| `createdAtTxnId` | string | Hash of the transaction the pair was created at |
| `factoryAddress` | string | Address of the smart contract used to create the pair (QX address: `BAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAARMID`) |

### Error Responses

#### 400 Bad Request
Missing required parameter:
```json
{
  "success": false,
  "error": "Missing required query parameter: id",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### 404 Not Found
Pair not found:
```json
{
  "success": false,
  "error": "Pair creation transaction not found for {pairId}. This may not be a valid pair address.",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### 500 Internal Server Error
Server error:
```json
{
  "success": false,
  "error": "Failed to fetch pair {pairId}: {error message}",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Implementation Details

The `/pair` endpoint implements the following process to retrieve pair information:

### Hardcoded Response

For the specific pair address `RAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADKAH`, the endpoint returns a hardcoded response:

```json
{
  "pair": {
    "id": "RAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADKAH",
    "asset0Id": "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFXIB",
    "asset1Id": "RAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADKAH",
    "createdAtBlockNumber": 34500000,
    "createdAtBlockTimestamp": 1760195702,
    "createdAtTxnId": "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFXIB",
    "factoryAddress": "BAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAARMID"
  }
}
```

### Dynamic Response Process

For all other pair addresses, the endpoint implements the following process:

### Step 1: Get Latest Tick
Calls the Qubic RPC endpoint `/tick-info` to get the current latest tick number.

**Qubic RPC**: `GET /v1/tick-info`

### Step 2: Get Transfer Transactions
Retrieves all transfer transactions for the pair address from tick 0 to the latest tick.

**Qubic RPC**: `GET /v1/identities/transfer-transactions`

**Parameters**:
- `identity`: The pair address
- `startTick`: 0
- `endTick`: Latest tick from Step 1

### Step 3: Find Creation Transaction
Searches through the transactions to find the pair creation transaction with the following criteria:

- `sourceId` == pair address (parameter)
- `destId` == QX address (`BAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAARMID`)
- `amount` == 1000000000

From this transaction, extracts:
- `tickNumber` → `createdAtBlockNumber`
- `txId` → `createdAtTxnId`

### Step 4: Get Tick Data
Retrieves the timestamp of the creation block.

**Qubic RPC**: `GET /v1/ticks/{tickNumber}/tick-data`

From the response, extracts the `timestamp` field and converts it to seconds for `createdAtBlockTimestamp`.

### Step 5: Construct Response
Assembles the final response with:
- `id`: The pair address (from input)
- `asset0Id`: Null address (constant: `AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFXIB`)
- `asset1Id`: The pair address (from input)
- `createdAtBlockNumber`: From Step 3
- `createdAtBlockTimestamp`: From Step 4
- `createdAtTxnId`: From Step 3
- `factoryAddress`: QX address (constant: `BAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAARMID`)

## Constants

| Constant | Value | Description |
|----------|-------|-------------|
| NULL_ADDRESS | `AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFXIB` | Qubic null address |
| QX_ADDRESS | `BAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAARMID` | QX DEX factory address |
| CREATION_AMOUNT | `1000000000` | Amount transferred in pair creation transaction |

## Testing

Run the test script to validate the endpoint:

```bash
node test-pair-endpoint.js
```

Make sure to set the environment variables in your `.env` file:

```bash
# API Configuration
PORT=3000
API_BASE_URL=http://localhost:3000/api/v1

# Qubic RPC Configuration
QUBIC_RPC_URL=https://rpc.qubic.org/v1
QUBIC_RPC_TIMEOUT=30000

# Test Configuration
TEST_PAIR_ADDRESS=YOURPAIRADDRESSHERE
```

## Example Usage

### Using cURL

```bash
# Query parameter
curl "http://localhost:3000/api/v1/pair?id=PAIRADDRESSEXAMPLE"

# Path parameter
curl "http://localhost:3000/api/v1/pair/PAIRADDRESSEXAMPLE"
```

### Using JavaScript/Node.js

```javascript
const axios = require('axios');

async function getPair(pairAddress) {
  try {
    const response = await axios.get(
      `http://localhost:3000/api/v1/pair?id=${pairAddress}`
    );
    console.log('Pair data:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

// Usage
getPair('PAIRADDRESSEXAMPLE');
```

### Using Python

```python
import requests

def get_pair(pair_address):
    try:
        response = requests.get(
            f'http://localhost:3000/api/v1/pair',
            params={'id': pair_address}
        )
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f'Error: {e}')
        return None

# Usage
pair_data = get_pair('PAIRADDRESSEXAMPLE')
print(pair_data)
```

## Notes

1. **Performance**: The endpoint may take some time to respond for pairs created very early (low tick numbers) because it needs to scan all transactions from tick 0 to the latest tick.

2. **Validation**: The endpoint validates that the provided address is a valid pair by checking if it has a creation transaction matching the expected criteria.

3. **Error Handling**: If no creation transaction is found, the endpoint returns a 404 error indicating the address may not be a valid pair.

4. **Qubic Specifics**: 
   - In Qubic, pairs are identified by their identity address
   - The first token (`asset0Id`) is always the null address (representing QUBIC native token)
   - The second token (`asset1Id`) is the pair address itself
   - All pairs are created through the QX DEX factory

## Related Endpoints

- `GET /api/v1/exchange` - Get exchange/DEX information
- `GET /api/v1/asset/:assetId` - Get asset/token information
- `GET /api/v1/latest-block` - Get latest block information

## References

- [Qubic RPC Documentation](https://qubic.github.io/integration/Partners/swagger/qubic-rpc-doc.html)
- [DEXTools Integration Specification](https://docs.dextools.io)

