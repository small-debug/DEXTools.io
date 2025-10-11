# Pair Endpoint Quick Start Guide

## 🚀 Quick Start

Get up and running with the `/pair` endpoint in 5 minutes.

## Prerequisites

- Node.js installed
- API server running (`npm start`)
- Valid Qubic pair address

## Basic Usage

### 1. Start the Server

```bash
npm start
```

### 2. Make Your First Request

```bash
# Test with hardcoded response (guaranteed to work)
curl "http://localhost:3000/api/v1/pair?id=RAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADKAH"

# Or replace PAIRADDRESS with your actual Qubic pair address
curl "http://localhost:3000/api/v1/pair?id=PAIRADDRESS"
```

### 3. Understand the Response

```json
{
  "pair": {
    "id": "PAIRADDRESS",                    // Your pair address
    "asset0Id": "AAAAAA...FXIB",            // Always null address (QUBIC)
    "asset1Id": "PAIRADDRESS",              // Same as pair address
    "createdAtBlockNumber": 12345,          // Block (tick) number
    "createdAtBlockTimestamp": 1630000000,  // Unix timestamp in seconds
    "createdAtTxnId": "abc123...",          // Creation transaction ID
    "factoryAddress": "BAAAAA...RMID"       // Always QX address
  }
}
```

## Two Ways to Call the Endpoint

### Method 1: Query Parameter (Recommended)
```bash
curl "http://localhost:3000/api/v1/pair?id=PAIRADDRESS"
```

### Method 2: Path Parameter
```bash
curl "http://localhost:3000/api/v1/pair/PAIRADDRESS"
```

Both methods return identical results.

## Code Examples

### JavaScript/Node.js

```javascript
const axios = require('axios');

async function getPair(pairAddress) {
  const response = await axios.get(
    'http://localhost:3000/api/v1/pair',
    { params: { id: pairAddress } }
  );
  return response.data;
}

// Usage
getPair('PAIRADDRESS').then(data => {
  console.log('Pair:', data.pair);
});
```

### Python

```python
import requests

def get_pair(pair_address):
    response = requests.get(
        'http://localhost:3000/api/v1/pair',
        params={'id': pair_address}
    )
    return response.json()

# Usage
pair_data = get_pair('PAIRADDRESS')
print(pair_data)
```

### cURL with Pretty Print

```bash
curl -s "http://localhost:3000/api/v1/pair?id=PAIRADDRESS" | jq
```

## Common Use Cases

### 1. Get Creation Information
```javascript
const { pair } = await getPair('PAIRADDRESS');
console.log(`Created at block: ${pair.createdAtBlockNumber}`);
console.log(`Creation date: ${new Date(pair.createdAtBlockTimestamp * 1000)}`);
```

### 2. Verify Factory
```javascript
const { pair } = await getPair('PAIRADDRESS');
const isQX = pair.factoryAddress === 'BAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAARMID';
console.log(`Created on QX: ${isQX}`);
```

### 3. Get Both Tokens
```javascript
const { pair } = await getPair('PAIRADDRESS');
console.log(`Base token (QUBIC): ${pair.asset0Id}`);
console.log(`Quote token: ${pair.asset1Id}`);
```

## Error Handling

### Missing Parameter
```bash
curl "http://localhost:3000/api/v1/pair"
# Response: 400 Bad Request
# {"success": false, "error": "Missing required query parameter: id"}
```

### Invalid Pair Address
```bash
curl "http://localhost:3000/api/v1/pair?id=INVALIDADDRESS"
# Response: 404 Not Found
# {"success": false, "error": "Pair creation transaction not found..."}
```

### Error Handling in Code

```javascript
try {
  const pair = await getPair('PAIRADDRESS');
  console.log('Success:', pair);
} catch (error) {
  if (error.response?.status === 404) {
    console.error('Pair not found');
  } else if (error.response?.status === 400) {
    console.error('Invalid request');
  } else {
    console.error('Server error');
  }
}
```

## Testing

### Run Test Suite
```bash
npm run test:pair
```

### Run Usage Example
```bash
# Set your test pair address in .env first
echo "TEST_PAIR_ADDRESS=YOURPAIRADDRESS" >> .env

# Run example
node examples/pair-usage.js
```

## Configuration

Add to your `.env` file:

```env
# API Configuration
PORT=3000
API_BASE_URL=http://localhost:3000/api/v1

# Qubic RPC
QUBIC_RPC_URL=https://rpc.qubic.org/v1
QUBIC_RPC_TIMEOUT=30000

# Testing (optional)
TEST_PAIR_ADDRESS=YOUR_ACTUAL_PAIR_ADDRESS
```

## Understanding Qubic Pairs

### Key Concepts

1. **Pair Address = asset1Id**: In Qubic, the pair address itself represents the second token
2. **asset0Id = Null Address**: The first token is always QUBIC (native token)
3. **Factory = QX**: All pairs are created through the QX DEX
4. **Creation Amount**: Pairs are created with a transfer of 1,000,000,000 units

### Constants

| Name | Value | Meaning |
|------|-------|---------|
| Null Address | `AAAAAA...FXIB` | QUBIC native token |
| QX Address | `BAAAAA...RMID` | QX DEX factory |

## Troubleshooting

### Problem: "Cannot connect to API"
**Solution**: Make sure the server is running
```bash
npm start
```

### Problem: "Cannot connect to Qubic RPC"
**Solution**: Check your `QUBIC_RPC_URL` in `.env`
```bash
# Test RPC connection
npm run test:qubic
```

### Problem: "Pair not found"
**Solution**: Verify the pair address is correct and exists on Qubic blockchain

### Problem: "Request takes too long"
**Reason**: Pairs created at very early blocks require scanning many transactions
**Solution**: This is normal; the first request may take time but subsequent requests can be cached

## Next Steps

1. ✅ Make your first request
2. 📚 Read full documentation: `docs/PAIR_ENDPOINT.md`
3. 🧪 Run tests: `npm run test:pair`
4. 💻 Try examples: `node examples/pair-usage.js`
5. 🔧 Integrate into your application

## Support

- **Full Documentation**: See `docs/PAIR_ENDPOINT.md`
- **Usage Examples**: See `examples/pair-usage.js`
- **Test Suite**: Run `npm run test:pair`
- **API Docs**: Visit `http://localhost:3000/api/v1/docs`

## Summary

```bash
# 1. Start server
npm start

# 2. Test endpoint
curl "http://localhost:3000/api/v1/pair?id=YOURPAIRADDRESS"

# 3. Run tests
npm run test:pair

# Done! 🎉
```

---

**Ready to integrate?** Check out `examples/pair-usage.js` for complete code examples!

