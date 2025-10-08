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
      const response = await this.client.get(`/tick/${identifier}`);
      return this.transformBlock(response.data);
    } catch (error) {
      throw new QubicRpcError(`Failed to fetch block ${identifier}: ${error.message}`, error.status);
    }
  }

  /**
   * Get asset/token information by ID
   * @param {string} assetId - Asset ID
   * @returns {Promise<Object>} Asset data
   */
  async getAsset(assetId) {
    try {
      // Note: This endpoint might need to be adjusted based on actual Qubic RPC API
      const response = await this.client.get(`/assets/${assetId}`);
      return this.transformAsset(response.data);
    } catch (error) {
      throw new QubicRpcError(`Failed to fetch asset ${assetId}: ${error.message}`, error.status);
    }
  }

  /**
   * Get exchange/DEX information
   * @param {string} exchangeId - Exchange ID or factory address
   * @returns {Promise<Object>} Exchange data
   */
  async getExchange(exchangeId) {
    try {
      // Note: This endpoint might need to be adjusted based on actual Qubic RPC API
      const response = await this.client.get(`/exchanges/${exchangeId}`);
      return this.transformExchange(response.data);
    } catch (error) {
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
   * @param {Object} data - Raw Qubic data
   * @returns {Object} Transformed data in DEXTools format
   */
  transformBlock(data) {
    // Qubic RPC tick response structure
    const tickNumber = data.tick || data.tickNumber || data.blockNumber || 0;
    const timestamp = data.timestamp || data.time || Math.floor(Date.now() / 1000);
    
    return {
      block: {
        blockNumber: parseInt(tickNumber),
        blockTimestamp: parseInt(timestamp)
      }
    };
  }

  /**
   * Transform asset data to DEXTools format
   * @param {Object} data - Raw Qubic data
   * @returns {Object} Transformed data in DEXTools format
   */
  transformAsset(data) {
    return {
      asset: {
        id: data.id || data.address || '',
        symbol: data.symbol || '',
        name: data.name || '',
        decimals: parseInt(data.decimals || 18),
        totalSupply: data.totalSupply || '0',
        circulatingSupply: data.circulatingSupply || '0',
        contractAddress: data.address || data.contractAddress || '',
        type: data.type || 'QUBIC',
        verified: Boolean(data.verified),
        createdAt: parseInt(data.createdAt || data.timestamp || Math.floor(Date.now() / 1000))
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
        id: data.id || '',
        name: data.name || '',
        factoryAddress: data.factoryAddress || '',
        routerAddress: data.routerAddress || '',
        fee: data.fee || '0',
        feeTo: data.feeTo || '',
        allPairsLength: parseInt(data.allPairsLength || 0),
        createdAt: parseInt(data.createdAt || data.timestamp || Math.floor(Date.now() / 1000)),
        verified: Boolean(data.verified)
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
