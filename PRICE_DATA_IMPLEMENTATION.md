# Price Data Implementation

## Overview

The reserves data for events is now fetched from price chart data stored in local files, which are automatically updated every 3 days.

## Implementation Details

### 1. **Price Data Storage**
- **Location**: `src/data/price-data.json`
- **Format**: JSON file containing price data for all assets
- **Update Frequency**: Automatically updated every 3 days

### 2. **Assets Data Storage**
- **Location**: `src/data/assets-data.json`
- **Format**: JSON file containing all QX assets
- **Update Frequency**: Fetched on demand and cached

### 3. **API Integration**
- **Assets API**: `https://qxinfo.qubic.org/api/v1/qx/assets`
- **Price Chart API**: `https://qxinfo.qubic.org/api/v1/qx/issuer/{issuer}/asset/{assetName}/chart/average-price`

### 4. **Automatic Updates**
The system checks if price data is older than 3 days and updates it automatically in the background.

## Methods Added

### `fetchAssetsData()`
Fetches all assets from QX API and saves to file.

### `getAssetNameForIssuer(issuer)`
Gets the asset name for a given issuer address.

### `fetchAndSavePriceData(issuer, assetName)`
Fetches price chart data for a specific asset and saves to file.

### `updateAllPriceData()`
Updates price data for all assets (called every 3 days).

### `getReservesForTimestamp(issuer, timestamp)`
Gets reserves (totalAmount, totalShares) for a specific timestamp by matching the date in price data.

### `shouldUpdatePriceData()`
Checks if price data needs updating (every 3 days).

## Data Flow

1. **First Request**: System checks if price data exists or is outdated
2. **Update Check**: If data is older than 3 days, updates run in background
3. **Reserve Lookup**: For each event, system looks up reserves by matching timestamp to price data
4. **Date Matching**: Converts block timestamp to YYYY-MM-DD format and finds matching entry

## Price Data Format

```json
{
  "{issuer}": {
    "issuer": "{issuer}",
    "assetName": "{assetName}",
    "lastUpdated": "2025-10-27T00:00:00.000Z",
    "data": [
      {
        "time": "2025-05-05",
        "min": 7600000000,
        "max": 9000000000,
        "totalShares": 2,
        "totalAmount": 16600000000,
        "averagePrice": 8.3E9,
        "totalTrades": 2
      }
    ]
  }
}
```

## Reserves Calculation

For each event:
- Extract `blockTimestamp` from the event
- Convert to date string (YYYY-MM-DD)
- Find matching entry in price data
- Use `totalAmount` as `asset0` reserve
- Use `totalShares` as `asset1` reserve

```javascript
reserves: {
  asset0: priceEntry.totalAmount.toString(),
  asset1: priceEntry.totalShares.toString()
}
```

## Benefits

1. **Performance**: Price data cached locally, no API calls for each event
2. **Automatic Updates**: Background updates every 3 days
3. **Resilient**: Falls back to cached data if API fails
4. **Accurate**: Uses average price data from QX API
5. **Efficient**: Single API call per asset, not per event
