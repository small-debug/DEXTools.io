const axios = require('axios');

class QubicRpcError extends Error {
  constructor(message, status, response) {
    super(message);
    this.name = 'QubicRpcError';
    this.status = status;
    this.response = response;
  }
}

class QubicClient {
  constructor() {
    this.baseURL = process.env.QUBIC_RPC_URL || 'http://localhost:8000';
    this.timeout = parseInt(process.env.QUBIC_RPC_TIMEOUT) || 10000;
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'DEXTools-Qubic-API/1.0.0'
      }
    });

    // Add request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        console.log(`🔄 Qubic RPC Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
        return config;
      },
      (error) => {
        console.error('❌ Qubic RPC Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => {
        console.log(`✅ Qubic RPC Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error('❌ Qubic RPC Response Error:', error.response?.status, error.message);
        throw new QubicRpcError(
          error.response?.data?.message || error.message,
          error.response?.status || 500,
          error.response?.data
        );
      }
    );
  }

  /**
   * Get the latest block information
   * @returns {Promise<Object>} Latest block data
   */
  async getLatestBlock() {
    try {
      const response = await this.client.get('/tick-info');
      return this.transformLatestBlock(response.data);
    } catch (error) {
      throw new QubicRpcError(`Failed to fetch latest block: ${error.message}`, error.status);
    }
  }

  /**
   * Get block by number or timestamp
   * @param {string|number} identifier - Block number or timestamp
   * @returns {Promise<Object>} Block data
   */
  async getBlock(identifier) {
    try {
      const response = await this.client.get(`/ticks/${identifier}/tick-data`);
      return this.transformBlock(response.data, identifier);
    } catch (error) {
      throw new QubicRpcError(`Failed to fetch block ${identifier}: ${error.message}`, error.status);
    }
  }

  /**
   * Get asset/token information by ID
   * @param {string} assetId - Asset ID (issuer ID)
   * @returns {Promise<Object>} Asset data
   */
  async getAsset(assetId) {
    try {
      console.log(`🔍 Getting asset basic info for issuer: ${assetId}`);
      
      // Step 1: Get asset basic info (id, name, symbol) from issuances endpoint
      const issuancesResponse = await this.client.get(`/assets/issuances?issuerIdentity=${assetId}`);
      const assets = issuancesResponse.data.assets || [];
      
      if (assets.length === 0) {
        throw new QubicRpcError(`No asset issuances found for issuer ${assetId}`, 404);
      }
      
      // Get the first asset (or we could iterate through all)
      const assetInfo = assets[0];
      const assetSymbol = assetInfo.data.name || 'QUBIC';
      const assetName = assetInfo.data.name || `Qubic ${assetSymbol} Token`;
      
      console.log(`✅ Found asset info - Symbol: ${assetSymbol}, Name: ${assetName}`);
      
      // Step 2: Get supply and holder data from owners endpoint
      console.log(`🔍 Getting supply data for ${assetSymbol}...`);
      const ownersResponse = await this.client.get(`/issuers/${assetId}/assets/${assetSymbol}/owners`);
      
      // Calculate supply and holder data from owners
      const assetData = this.calculateAssetDataFromOwners(ownersResponse.data, assetId, assetSymbol, assetName);
      
      return this.transformAsset(assetData, assetId);
    } catch (error) {
      if (error.status === 404) {
        throw new QubicRpcError(`Asset ${assetId} not found in Qubic network. Please verify the asset ID is correct.`, 404);
      }
      throw new QubicRpcError(`Failed to fetch asset ${assetId}: ${error.message}`, error.status);
    }
  }

  /**
   * Get asset holders with pagination
   * @param {string} assetId - Asset ID (issuer ID)
   * @param {number} page - Page number (1-based)
   * @param {number} pageSize - Number of items per page
   * @returns {Promise<Object>} Asset holders data
   */
  async getAssetHolders(assetId, page = 1, pageSize = 10) {
    try {
      console.log(`🔍 Getting asset holders for issuer: ${assetId}, page: ${page}, pageSize: ${pageSize}`);
      
      // Step 1: Get asset basic info to extract token name
      const issuancesResponse = await this.client.get(`/assets/issuances?issuerIdentity=${assetId}`);
      const assets = issuancesResponse.data.assets || [];
      
      if (assets.length === 0) {
        throw new QubicRpcError(`No asset issuances found for issuer ${assetId}`, 404);
      }
      
      // Get the first asset (or we could iterate through all)
      const assetInfo = assets[0];
      const assetSymbol = assetInfo.data.name || 'QUBIC';
      
      console.log(`✅ Found asset symbol: ${assetSymbol}`);
      
      // Step 2: Get holders data with pagination
      console.log(`🔍 Getting holders data for ${assetSymbol}...`);
      const ownersResponse = await this.client.get(`/issuers/${assetId}/assets/${assetSymbol}/owners?page=${page}&pageSize=${pageSize}`);
      
      // Transform the data to DEXTools format
      return this.transformAssetHolders(ownersResponse.data, assetId);
    } catch (error) {
      if (error.status === 404) {
        throw new QubicRpcError(`Asset ${assetId} not found in Qubic network. Please verify the asset ID is correct.`, 404);
      }
      throw new QubicRpcError(`Failed to fetch asset holders for ${assetId}: ${error.message}`, error.status);
    }
  }

  /**
   * Get exchange/DEX information
   * @param {string} exchangeId - Exchange ID or factory address
   * @returns {Promise<Object>} Exchange data
   */
  async getExchange(exchangeId) {
    try {
      console.log(`🔍 Getting exchange info for: ${exchangeId}`);
      
      // Hardcoded Qubic DEXs
      const qubicDexs = {
        'BAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAARMID': {
          factoryAddress: 'BAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAARMID',
          name: 'QX',
          logoURL: '/images/Qubic-Symbol-White.png'
        },
        'NAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMAML': {
          factoryAddress: 'NAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMAML',
          name: 'QSWAP',
          logoURL: '/images/Qubic-Symbol-White.png'
        }
      };
      
      // Check if the exchange ID matches any of the known Qubic DEXs
      if (qubicDexs[exchangeId]) {
        console.log(`✅ Found Qubic DEX: ${qubicDexs[exchangeId].name}`);
        return this.transformExchange(qubicDexs[exchangeId]);
      }
      
      // If not found in hardcoded list, try to fetch from RPC (fallback)
      try {
        const response = await this.client.get(`/exchanges/${exchangeId}`);
        return this.transformExchange(response.data);
      } catch (rpcError) {
        throw new QubicRpcError(`Exchange ${exchangeId} not found. Available exchanges: QX, QSWAP`, 404);
      }
    } catch (error) {
      if (error.status === 404) {
        throw error;
      }
      throw new QubicRpcError(`Failed to fetch exchange ${exchangeId}: ${error.message}`, error.status);
    }
  }

  /**
   * Get trading pair information
   * @param {string} pairId - Pair ID
   * @returns {Promise<Object>} Pair data
   */
  async getPair(pairId) {
    try {
      // Note: This endpoint might need to be adjusted based on actual Qubic RPC API
      const response = await this.client.get(`/pairs/${pairId}`);
      return this.transformPair(response.data);
    } catch (error) {
      throw new QubicRpcError(`Failed to fetch pair ${pairId}: ${error.message}`, error.status);
    }
  }

  /**
   * Get events (transactions, swaps, etc.)
   * @param {Object} filters - Query filters
   * @returns {Promise<Object>} Events data
   */
  async getEvents(filters = {}) {
    try {
      const params = new URLSearchParams(filters);
      const response = await this.client.get(`/events?${params}`);
      return this.transformEvents(response.data);
    } catch (error) {
      throw new QubicRpcError(`Failed to fetch events: ${error.message}`, error.status);
    }
  }

  /**
   * Transform latest block data to DEXTools format
   * @param {Object} data - Raw Qubic data
   * @returns {Object} Transformed data in DEXTools format
   */
  transformLatestBlock(data) {
    // Qubic RPC tick-info response structure: data.tickInfo.tick
    const tickInfo = data.tickInfo || data;
    const tickNumber = tickInfo.tick || tickInfo.currentTick || tickInfo.tickNumber || 0;
    const timestamp = tickInfo.timestamp || tickInfo.time || Math.floor(Date.now() / 1000);
    
    // Log the raw data for debugging
    console.log('🔍 Raw Qubic RPC Response:', JSON.stringify(data, null, 2));
    console.log('📊 Extracted tick number:', tickNumber);
    
    return {
      block: {
        blockNumber: parseInt(tickNumber),
        blockTimestamp: parseInt(timestamp)
      }
    };
  }

  /**
   * Transform block data to DEXTools format
   * @param {Object} data - Raw Qubic data from /v1/ticks/{tickNumber}/tick-data
   * @param {string|number} tickNumber - The tick number used in the request
   * @returns {Object} Transformed data in DEXTools format
   */
  transformBlock(data, tickNumber) {
    // Extract timestamp from the tick data
    // The timestamp is in milliseconds, so we need to convert to seconds
    const timestamp = data.tickData?.timestamp || data.timestamp || Math.floor(Date.now() / 1000);
    const timestampInSeconds = Math.floor(parseInt(timestamp) / 1000);
    
    return {
      block: {
        blockNumber: parseInt(tickNumber),
        blockTimestamp: timestampInSeconds
      }
    };
  }

  /**
   * Calculate asset data from Qubic RPC asset owners response
   * @param {Object} ownersData - Asset owners data from Qubic RPC API
   * @param {string} assetId - The asset ID (issuer ID)
   * @param {string} assetSymbol - The asset symbol
   * @param {string} assetName - The asset name
   * @returns {Object} Calculated asset data
   */
  calculateAssetDataFromOwners(ownersData, assetId, assetSymbol, assetName) {
    const owners = ownersData.owners || [];
    const pagination = ownersData.pagination || {};
    
    // Get totalRecords for holdersCount from pagination
    const holdersCount = pagination.totalRecords || owners.length;
    
    // Calculate total supply by summing numberOfShares for all owners
    const totalSupply = owners.reduce((sum, owner) => {
      return (BigInt(sum) + BigInt(owner.numberOfShares || 0)).toString();
    }, '0');
    
    // For Qubic, circulating supply is the same as total supply
    // (no burning mechanism in basic Qubic tokens)
    const circulatingSupply = totalSupply;
    
    return {
      id: assetId,
      name: assetName,
      symbol: assetSymbol,
      totalSupply,
      circulatingSupply,
      holdersCount
    };
  }

  /**
   * Transform asset holders data to DEXTools format
   * @param {Object} ownersData - Asset owners data from Qubic RPC API
   * @param {string} assetId - The asset ID (issuer ID)
   * @returns {Object} Transformed data in DEXTools format
   */
  transformAssetHolders(ownersData, assetId) {
    const owners = ownersData.owners || [];
    const pagination = ownersData.pagination || {};
    
    // Get total records for totalHoldersCount
    const totalHoldersCount = pagination.totalRecords || owners.length;
    
    // Transform owners to holders format
    const holders = owners.map(owner => ({
      address: owner.identity,
      quantity: parseInt(owner.numberOfShares || 0)
    }));
    
    return {
      asset: {
        id: assetId,
        totalHoldersCount,
        holders
      }
    };
  }

  /**
   * Transform asset data to DEXTools format
   * @param {Object} data - Raw Qubic data
   * @param {string} assetId - The asset ID used in the request
   * @returns {Object} Transformed data in DEXTools format
   */
  transformAsset(data, assetId) {
    return {
      asset: {
        id: data.id || data.address || assetId,
        name: data.name || data.tokenName || '',
        symbol: data.symbol || data.tokenSymbol || '',
        totalSupply: data.totalSupply || data.supply || '0',
        circulatingSupply: data.circulatingSupply || data.circulating || '0',
        holdersCount: parseInt(data.holdersCount || data.holderCount || data.holders || 0)
      }
    };
  }

  /**
   * Transform exchange data to DEXTools format
   * @param {Object} data - Raw Qubic data
   * @returns {Object} Transformed data in DEXTools format
   */
  transformExchange(data) {
    return {
      exchange: {
        factoryAddress: data.factoryAddress || data.id || '',
        name: data.name || '',
        logoURL: data.logoURL || undefined
      }
    };
  }

  /**
   * Transform pair data to DEXTools format
   * @param {Object} data - Raw Qubic data
   * @returns {Object} Transformed data in DEXTools format
   */
  transformPair(data) {
    return {
      pair: {
        id: data.id || '',
        token0: data.token0 || '',
        token1: data.token1 || '',
        reserve0: data.reserve0 || '0',
        reserve1: data.reserve1 || '0',
        totalSupply: data.totalSupply || '0',
        kLast: data.kLast || '0',
        price0CumulativeLast: data.price0CumulativeLast || '0',
        price1CumulativeLast: data.price1CumulativeLast || '0',
        createdAt: parseInt(data.createdAt || data.timestamp || Math.floor(Date.now() / 1000)),
        exchange: data.exchange || ''
      }
    };
  }

  /**
   * Transform events data to DEXTools format
   * @param {Object} data - Raw Qubic data
   * @returns {Object} Transformed data in DEXTools format
   */
  transformEvents(data) {
    const events = (data.events || data.transactions || []).map(event => ({
      id: event.id || event.hash || '',
      type: event.type || 'transaction',
      blockNumber: parseInt(event.blockNumber || event.block || 0),
      blockTimestamp: parseInt(event.timestamp || Math.floor(Date.now() / 1000)),
      transactionHash: event.hash || event.transactionHash || '',
      from: event.from || '',
      to: event.to || '',
      value: event.value || '0',
      gasUsed: event.gasUsed || '0',
      gasPrice: event.gasPrice || '0',
      status: event.status || 'success'
    }));

    return {
      events: events,
      total: parseInt(data.total || data.count || 0),
      page: parseInt(data.page || 1),
      limit: parseInt(data.limit || 100),
      hasMore: Boolean(data.hasMore || false)
    };
  }
}

module.exports = { QubicClient, QubicRpcError };
