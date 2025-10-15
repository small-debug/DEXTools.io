# DEXTools Qubic API

A JavaScript API project that provides DEXTools integration methods for Qubic blockchain data, implementing the Path Table specifications from the DEXTools Integration SDK.

## 🚀 Features

- **DEXTools Integration**: Implements all required Path Table methods
- **Qubic RPC Integration**: Fetches data from Qubic blockchain
- **RESTful API**: Clean, well-documented REST endpoints
- **Error Handling**: Comprehensive error handling and validation
- **Documentation**: Built-in API documentation
- **Health Monitoring**: Health check endpoints

## 📋 API Endpoints

### Core Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/latest-block` | Get the latest block information |
| `GET` | `/api/v1/block?number=:number` | Get block by number (query param) |
| `GET` | `/api/v1/block/:identifier` | Get block by number or timestamp (path param) |
| `GET` | `/api/v1/asset?id=:id` | Get asset/token information by ID (query param) |
| `GET` | `/api/v1/asset/:assetId` | Get asset/token information by ID (path param) |
| `GET` | `/api/v1/asset/holders` | Get asset holders with pagination |
| `GET` | `/api/v1/exchange?id=:id` | Get exchange/DEX information (query param) |
| `GET` | `/api/v1/exchange/:exchangeId` | Get exchange/DEX information (path param) |
| `GET` | `/api/v1/pair?id=:id` | Get trading pair information (query param) |
| `GET` | `/api/v1/pair/:pairId` | Get trading pair information (path param) |
| `GET` | `/api/v1/events` | Get events (swaps, transactions) in block range |
| `GET` | `/api/v1/events/addresses/cache` | Get active addresses cache information |
| `GET` | `/api/v1/events/cycling/stats` | Get cycling statistics |
| `POST` | `/api/v1/events/addresses/force-refresh` | Force refresh all active addresses (ignores cache) |

### Utility Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/docs` | API documentation |
| `GET` | `/health` | Health check |

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd dextools-qubic-api
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Start the server**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## ⚙️ Configuration

Create a `.env` file with the following variables:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Qubic RPC Configuration
QUBIC_RPC_URL=http://localhost:8000
QUBIC_RPC_TIMEOUT=10000

# API Configuration
API_VERSION=v1
CORS_ORIGIN=*
```

### 🔗 Qubic RPC Setup

This API requires a running Qubic RPC server. The default configuration expects Qubic RPC to be running on `http://localhost:8000`.

**To start Qubic RPC:**
1. Follow the [Qubic RPC setup instructions](https://github.com/qubic/qubic-http)
2. Start the Qubic RPC server (usually on port 8000)
3. Verify it's running: `curl http://localhost:8000/tick-info`

**Test Qubic RPC Connection:**
```bash
npm run test:qubic
```

## 📖 Usage Examples

### Get Latest Block
```bash
curl http://localhost:3000/api/v1/latest-block
```

### Get Specific Block
```bash
# Using query parameter (recommended)
curl "http://localhost:3000/api/v1/block?number=12345"

# Using path parameter
curl http://localhost:3000/api/v1/block/12345
```

### Get Asset Information
```bash
# Using query parameter (recommended)
curl "http://localhost:3000/api/v1/asset?id=0x1234..."

# Using path parameter
curl http://localhost:3000/api/v1/asset/0x1234...
```

### Get Exchange Information
```bash
# Using query parameter (recommended)
curl "http://localhost:3000/api/v1/exchange?id=0x5678..."

# Using path parameter
curl http://localhost:3000/api/v1/exchange/0x5678...
```

### Get Trading Pair
```bash
# Using query parameter
curl "http://localhost:3000/api/v1/pair?id=PAIRADDRESSEXAMPLE"

# Using path parameter
curl http://localhost:3000/api/v1/pair/PAIRADDRESSEXAMPLE
```

### Get Events in Block Range
```bash
# Get all events
curl "http://localhost:3000/api/v1/events"

# Get events in specific block range
curl "http://localhost:3000/api/v1/events?fromBlock=1000&toBlock=2000"

# Get events from a specific block onwards
curl "http://localhost:3000/api/v1/events?fromBlock=5000"
```

### Get Events Collection Status
```bash
curl "http://localhost:3000/api/v1/events/status"
```

### Manage Active Addresses Cache
```bash
# Get cache information
curl "http://localhost:3000/api/v1/events/addresses/cache"

# Get fetch progress
curl "http://localhost:3000/api/v1/events/addresses/progress"

# Manually refresh cache (starts from page 1)
curl -X POST "http://localhost:3000/api/v1/events/addresses/refresh"

# Force refresh all addresses (ignores cache)
curl -X POST "http://localhost:3000/api/v1/events/addresses/force-refresh"
```

### Monitor Cycling Process
```bash
# Get cycling statistics
curl "http://localhost:3000/api/v1/events/cycling/stats"

# Get events collection status
curl "http://localhost:3000/api/v1/events/status"
```

## 📊 Response Format

All API responses follow the DEXTools Integration SDK specification:

### Block Endpoints (`/latest-block`, `/block/:identifier`)
```json
{
  "block": {
    "blockNumber": 12345,
    "blockTimestamp": 1630000000
  }
}
```

### Asset Endpoint (`/asset/:assetId`)
```json
{
  "asset": {
    "id": "0x1234...",
    "symbol": "QUBC",
    "name": "Qubic Token",
    "decimals": 18,
    "totalSupply": "1000000000",
    "circulatingSupply": "500000000",
    "contractAddress": "0x1234...",
    "type": "QUBIC",
    "verified": true,
    "createdAt": 1630000000
  }
}
```

### Exchange Endpoint (`/exchange/:exchangeId`)
```json
{
  "exchange": {
    "id": "exchange123",
    "name": "Qubic DEX",
    "factoryAddress": "0x5678...",
    "routerAddress": "0x9abc...",
    "fee": "0.003",
    "feeTo": "0xdef0...",
    "allPairsLength": 150,
    "createdAt": 1630000000,
    "verified": true
  }
}
```

### Pair Endpoint (`/pair` or `/pair/:pairId`)
```json
{
  "pair": {
    "id": "PAIRADDRESSEXAMPLE",
    "asset0Id": "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFXIB",
    "asset1Id": "PAIRADDRESSEXAMPLE",
    "createdAtBlockNumber": 12345,
    "createdAtBlockTimestamp": 1630000000,
    "createdAtTxnId": "txn123abc",
    "factoryAddress": "BAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAARMID"
  }
}
```

### Events Endpoint (`/events`)
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

### Error Responses
```json
{
  "error": "Error message"
}
```

## 🧪 Testing

Run the test suite:

```bash
# Run all tests
npm test

# Test Qubic RPC connection
npm run test:qubic

# Test response format
npm run test:format

# Test cycling functionality
npm run test:cycling
```

## 📚 API Documentation

Visit `http://localhost:3000/api/v1/docs` for interactive API documentation.

## 🔧 Development

### Project Structure

```
src/
├── index.js              # Main server file
├── routes/
│   └── qubic.js          # API routes
├── services/
│   └── qubicClient.js    # Qubic RPC client
└── middleware/
    ├── errorHandler.js   # Error handling
    └── validation.js     # Request validation
```

### Adding New Endpoints

1. Add the route in `src/routes/qubic.js`
2. Implement the method in `src/services/qubicClient.js`
3. Add validation if needed in `src/middleware/validation.js`
4. Update documentation

## 🚀 Deployment

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### Environment Variables for Production

- `NODE_ENV=production`
- `PORT=3000`
- `QUBIC_RPC_URL=https://rpc.qubic.org/v1`
- `CORS_ORIGIN=https://yourdomain.com`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🔗 Related Links

- [DEXTools Integration SDK](https://github.com/dextools-io/integration-sdk)
- [Qubic RPC Documentation](https://qubic.github.io/integration/Partners/swagger/qubic-rpc-doc.html)
- [DEXTools Platform](https://www.dextools.io/)

## 📞 Support

For support and questions, please open an issue in the repository.
