const axios = require('axios');
const lib = require("@qubic-lib/qubic-ts-library")
const { base64ToUint8Array, uint8ArrayToBase64, assetNameConvert, createDataView } = require("../utils");
const { QubicHelper } = require("@qubic-lib/qubic-ts-library/dist/qubicHelper");
const CacheService = require('./cacheService');

const qHelper = new lib.default.QubicHelper();

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
    this.baseURL = process.env.QUBIC_RPC_URL || 'https://rpc.qubic.org';
    this.timeout = parseInt(process.env.QUBIC_RPC_TIMEOUT) || 10000;
    this.cache = new CacheService();
    
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
      // Check cache first
      const cached = this.cache.getCachedLatestBlock();
      if (cached) {
        console.log('📦 Using cached latest block');
        return cached;
      }

      console.log('🔍 Fetching latest block from RPC...');
      const response = await this.client.get('/v1/tick-info');
      const blockData = this.transformLatestBlock(response.data);
      
      // Cache the result
      this.cache.cacheLatestBlock(blockData);
      
      return blockData;
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
      const response = await this.client.get(`/v1/ticks/${identifier}/tick-data`);
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
      const issuancesResponse = await this.client.get(`/v1/assets/issuances?issuerIdentity=${assetId}`);
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
      const ownersResponse = await this.client.get(`/v1/issuers/${assetId}/assets/${assetSymbol}/owners`);
      
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
      const issuancesResponse = await this.client.get(`/v1/assets/issuances?issuerIdentity=${assetId}`);
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
      const ownersResponse = await this.client.get(`/v1/issuers/${assetId}/assets/${assetSymbol}/owners?page=${page}&pageSize=${pageSize}`);
      
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
        const response = await this.client.get(`/v1/exchanges/${exchangeId}`);
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
   * @param {string} pairId - Pair ID (identity address)
   * @returns {Promise<Object>} Pair data
   */
  async getPair(pairId) {
    try {
      console.log(`🔍 Getting pair info for: ${pairId}`);
      
      // Constants
      const NULL_ADDRESS = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFXIB';
      const QX_ADDRESS = 'BAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAARMID';
      const CREATION_AMOUNT = 1000000000;
      
      // Hardcoded response for specific pair address
      const HARDCODED_PAIR_ADDRESS = 'RAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADKAH';
      if (pairId === HARDCODED_PAIR_ADDRESS) {
        console.log(`📊 Using hardcoded response for ${HARDCODED_PAIR_ADDRESS}`);
        
        const hardcodedPairData = {
          id: pairId,
          asset0Id: NULL_ADDRESS,
          asset1Id: pairId,
          createdAtBlockNumber: 34500000,
          createdAtBlockTimestamp: 1760195702,
          createdAtTxnId: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFXIB',
          factoryAddress: QX_ADDRESS
        };
        
        console.log(`✅ Hardcoded pair data:`, JSON.stringify(hardcodedPairData, null, 2));
        return this.transformPair(hardcodedPairData);
      }
      
      // Step 1: Get latest tick
      console.log(`📊 Step 1: Getting latest tick...`);
      const latestTickResponse = await this.client.get('/v1/tick-info');
      const latestTick = latestTickResponse.data.tickInfo?.tick || latestTickResponse.data.tick || 0;
      console.log(`✅ Latest tick: ${latestTick}`);
      
      // Step 2: Get transfer transactions from tick 0 to latest tick for this identity
      console.log(`📊 Step 2: Getting transfer transactions for identity ${pairId} from tick 0 to ${latestTick}...`);
      const transfersResponse = await this.client.get(`/v1/identities/${pairId}/transfer-transactions`, {
        params: {
          startTick: 0,
          endTick: latestTick
        }
      });
      
      // Extract transactions from the nested structure
      const transferTransactionsPerTick = transfersResponse.data.transferTransactionsPerTick || [];
      const transactions = [];
      
      // Flatten all transactions from all ticks
      transferTransactionsPerTick.forEach(tickData => {
        if (tickData.transactions && Array.isArray(tickData.transactions)) {
          transactions.push(...tickData.transactions);
        }
      });
      
      console.log(`✅ Found ${transactions.length} transactions across ${transferTransactionsPerTick.length} ticks`);
      
      // Step 3: Find the creation transaction
      // Condition: sourceId == pairId, destId == QX_ADDRESS, amount == 1000000000
      console.log(`📊 Step 3: Searching for creation transaction...`);
      console.log(`   Looking for: sourceId=${pairId}, destId=${QX_ADDRESS}, amount=${CREATION_AMOUNT}`);
      
      let creationTransaction = null;
      for (const tx of transactions) {
        const sourceId = tx.sourceId || '';
        const destId = tx.destId || '';
        const amount = parseInt(tx.amount || 0);
        
        console.log(`   Checking transaction: sourceId=${sourceId}, destId=${destId}, amount=${amount}`);
        
        if (sourceId === pairId && destId === QX_ADDRESS && amount === CREATION_AMOUNT) {
          creationTransaction = tx;
          console.log(`✅ Found creation transaction: tickNumber=${tx.tickNumber}, txId=${tx.txId}`);
          break;
        }
      }
      
      if (!creationTransaction) {
        throw new QubicRpcError(`Pair creation transaction not found for ${pairId}. This may not be a valid pair address.`, 404);
      }
      
      const createdAtBlockNumber = creationTransaction.tickNumber || 0;
      const createdAtTxnId = creationTransaction.txId || '';
      
      // Step 4: Get tick data for the creation block to get timestamp
      console.log(`📊 Step 4: Getting tick data for block ${createdAtBlockNumber}...`);
      const tickDataResponse = await this.client.get(`/v1/ticks/${createdAtBlockNumber}/tick-data`);
      const createdAtBlockTimestamp = Math.floor(parseInt(tickDataResponse.data.tickData?.timestamp || Date.now()) / 1000);
      console.log(`✅ Creation timestamp: ${createdAtBlockTimestamp}`);
      
      // Construct the pair data
      const pairData = {
        id: pairId,
        asset0Id: NULL_ADDRESS,
        asset1Id: pairId,
        createdAtBlockNumber: createdAtBlockNumber,
        createdAtBlockTimestamp: createdAtBlockTimestamp,
        createdAtTxnId: createdAtTxnId,
        factoryAddress: QX_ADDRESS
      };
      
      console.log(`✅ Successfully retrieved pair data:`, JSON.stringify(pairData, null, 2));
      
      return this.transformPair(pairData);
    } catch (error) {
      if (error.name === 'QubicRpcError') {
        throw error;
      }
      throw new QubicRpcError(`Failed to fetch pair ${pairId}: ${error.message}`, error.status || 500);
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
      const response = await this.client.get(`/v1/events?${params}`);
      return this.transformEvents(response.data);
    } catch (error) {
      throw new QubicRpcError(`Failed to fetch events: ${error.message}`, error.status);
    }
  }

    async getResponseValues(res) {
      if (!res.responseData) return null;
      const responseView = new DataView(base64ToUint8Array(res.responseData).buffer);
      const responseArray = base64ToUint8Array(res.responseData);

      return {
        getUint64: (offset) => Number(responseView.getBigUint64(offset, true)),
        getUint32: (offset) => responseView.getUint32(offset, true),
        getUint8: (offset) => responseView.getUint8(offset),
        getID: (offset) => qHelper.getIdentity(responseArray.slice(offset, offset + 32)),
      };
    };

    async fetchQuerySC(data) {
      const response = await this.client.post('/v1/querySmartContract', data);
      return response.data;
    };

    async getSumOfShares(issuer, assetName, offset) {
      const issuerBytes = qHelper.getIdentityBytes(issuer);
      const {view} = createDataView(48);
      for (let i = 0; i < 32; i++) {
        view.setUint8(i, issuerBytes[i]);
      }
      view.setBigUint64(32, assetNameConvert(assetName), true);  
      view.setBigUint64(40, BigInt(offset), true);
      console.log("view", view);

      const res = await this.fetchQuerySC({
        contractIndex: 1,
        inputType: 2,
        inputSize: 48,
        requestData: uint8ArrayToBase64(new Uint8Array(view.buffer)),
      });

      const values = await this.getResponseValues(res);
      if (!values) return null;

      console.log({res, values})
      let sum = 0;
      for (let i = 0; i < 256; i++) {
        sum += values.getUint64(40 + i * 48);
      }
      console.log("sum", sum);
      return sum;
    };

    async getSumOfQubic(issuer, assetName, offset) {
      const issuerBytes = qHelper.getIdentityBytes(issuer);
      const {view} = createDataView(48);
      for (let i = 0; i < 32; i++) {
        view.setUint8(i, issuerBytes[i]);
      }
      view.setBigUint64(32, assetNameConvert(assetName), true);  
      view.setBigUint64(40, BigInt(offset), true);

      console.log("view", view);
      const res = await this.fetchQuerySC({
        contractIndex: 1,
        inputType: 3,
        inputSize: 48,
        requestData: uint8ArrayToBase64(new Uint8Array(view.buffer)),
      });

      const values = await this.getResponseValues(res);
      if (!values) return null;

      let sum = 0;
      for (let i = 0; i < 256; i++) {
        sum += values.getUint64(40 + i * 48) * values.getUint64(32 + i * 48);
      }
      console.log("sum", sum);
      return sum;
    };

  /**
   * Get events in a tick range using Qubic RPC API
   * @param {number} fromBlock - Start tick number
   * @param {number} toBlock - End tick number
   * @returns {Promise<Object>} Events data in DEXTools format
   */
  async getEventsInTickRange(fromBlock, toBlock) {
    try {
      console.log(`🔍 Getting events from tick ${fromBlock} to ${toBlock}`);
      
      // Check if this range is known to be empty
      if (this.cache.isEmptyRange(fromBlock, toBlock)) {
        console.log('📦 Using cached empty range - returning empty events');
        return {
          events: []
        };
      }
      
      // Use the QX address as the identity to get transfers
      const QX_ADDRESS = 'BAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAARMID';
      
      // Fetch transfers using the Qubic RPC API v2
      const response = await this.client.get(`/v2/identities/${QX_ADDRESS}/transfers`, {
        params: {
          startTick: fromBlock,
          endTick: toBlock
        }
      });
      
      const data = response.data;
      const transactions = data.transactions || [];
      
      console.log(`✅ Found ${transactions.length} transactions in tick range`);
      
      // If no transactions, cache this as an empty range for fast future responses
      if (transactions.length === 0) {
        this.cache.cacheEmptyRange(fromBlock, toBlock);
        console.log('📦 Cached empty range for future requests');
        return {
          events: []
        };
      }
      
      // Transform transactions to events format
      const events = await this.transformTransactionsToEvents(transactions);
      
      return {
        events: events
      };
    } catch (error) {
      throw new QubicRpcError(`Failed to fetch events in tick range ${fromBlock}-${toBlock}: ${error.message}`, error.status);
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
        asset0Id: data.asset0Id || '',
        asset1Id: data.asset1Id || '',
        createdAtBlockNumber: parseInt(data.createdAtBlockNumber || 0),
        createdAtBlockTimestamp: parseInt(data.createdAtBlockTimestamp || 0),
        createdAtTxnId: data.createdAtTxnId || '',
        factoryAddress: data.factoryAddress || ''
      }
    };
  }

  /**
   * Transform transactions to events format for DEXTools
   * @param {Array} transactions - Array of transaction data from Qubic RPC
   * @returns {Array} Transformed events in DEXTools format
   */
  async transformTransactionsToEvents(transactions) {
    const events = [];
    let eventIndex = 0;

    for (const tickData of transactions) {
      const tickNumber = tickData.tickNumber;
      const tickTransactions = tickData.transactions || [];

      for (let txnIndex = 0; txnIndex < tickTransactions.length; txnIndex++) {
        const txData = tickTransactions[txnIndex];
        const transaction = txData.transaction;
        const timestamp = txData.timestamp;

        // Parse inputHex to extract pairId and asset1Out
        const parsedInput = await this.parseInputHex(transaction.inputHex, transaction.inputType);

        if (parsedInput.pairId === "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFXIB" || transaction.amount <= 100) {
          continue;
        }

        // Fetch the asset name of the pairId from the Qubic RPC response body
        const assetResponse = await this.client.get(`/v1/assets/${parsedInput.pairId}/issued`);
        const assetName = assetResponse.data?.issuedAssets?.[0]?.data?.name || "";
        const sumOfShares = await this.getSumOfShares(parsedInput.pairId, assetName, 0);
        const sumOfQubic = await this.getSumOfQubic(parsedInput.pairId, assetName, 0);

        // Create event object
        const event = {
          block: {
            blockNumber: parseInt(tickNumber),
            blockTimestamp: Math.floor(parseInt(timestamp) / 1000) // Convert to seconds
          },
          txnId: transaction.txId,
          txnIndex: txnIndex,
          eventIndex: eventIndex++,
          maker: transaction.sourceId,
          pairId: parsedInput.pairId || transaction.destId, // Use destId as fallback
          eventType: "swap",
          asset0In: transaction.amount,
          asset1Out: parsedInput.asset1Out || "0",
          reserves: {
            asset0: sumOfQubic, // Will be implemented later as per user request
            asset1: sumOfShares  // Will be implemented later as per user request
          }
        };

        events.push(event);
      }
    }

    return events;
  }

  /**
   * Parse inputHex to extract pairId and asset1Out based on Qubic transaction structure
   * @param {string} inputHex - Hex string from transaction input
   * @param {number} inputType - Input type from transaction
   * @returns {Object} Parsed data containing pairId and asset1Out
   */
  async parseInputHex(inputHex, inputType) {
    try {
      if (!inputHex || inputHex.length < 16) {
        return { pairId: null, asset1Out: "0" };
      }

      // Convert hex to buffer for easier parsing
      const buffer = Buffer.from(inputHex, 'hex');
      
      console.log(`🔍 Parsing inputHex (type ${inputType}): ${inputHex}`);
      
      // Based on Qubic transaction structure and inputType
      let pairId = null;
      let asset1Out = "0";
      
      switch (inputType) {
        case 5: // AddToAskOrder transaction
          if (buffer.length >= 40) {
            const pairIdBytes = buffer.slice(0, 32);
            pairId = await this.bytesToQubicAddress(pairIdBytes);
            
            const amountBytes = buffer.slice(48, 56);
            asset1Out = this.bytesToBigInt(amountBytes).toString();
          }
          break;
          
        case 6: // AddToBidOrder transaction
          if (buffer.length >= 40) {
            const pairIdBytes = buffer.slice(0, 32);
            pairId = await this.bytesToQubicAddress(pairIdBytes);
            
            const amountBytes = buffer.slice(48, 56);
            asset1Out = this.bytesToBigInt(amountBytes).toString();
          }
          break;
          
        case 7: // RemoveFromAskOrder transaction
          if (buffer.length >= 32) {
            const pairIdBytes = buffer.slice(0, 32);
            pairId = await this.bytesToQubicAddress(pairIdBytes);

            const amountBytes = buffer.slice(48, 56);
            asset1Out = this.bytesToBigInt(amountBytes).toString();
          }
          break;
          
        case 8: // DRAW/CAP transaction
          // For DRAW/CAP: first 32 bytes contain pairId, next 8 bytes contain amount
          if (buffer.length >= 40) {
            const pairIdBytes = buffer.slice(0, 32);
            pairId = await this.bytesToQubicAddress(pairIdBytes);
            
            const amountBytes = buffer.slice(48, 56);
            asset1Out = this.bytesToBigInt(amountBytes).toString();
          }
          break;
          
        default:
          // For unknown types, try to extract from first 32 bytes
          if (buffer.length >= 32) {
            const pairIdBytes = buffer.slice(0, 32);
            pairId = await this.bytesToQubicAddress(pairIdBytes);
          }
          break;
      }
      
      console.log(`🔍 Parsed (type ${inputType}) - pairId: ${pairId}, asset1Out: ${asset1Out}`);
      
      return {
        pairId: pairId,
        asset1Out: asset1Out
      };
    } catch (error) {
      console.error('❌ Error parsing inputHex:', error);
      return { pairId: null, asset1Out: "0" };
    }
  }

  /**
   * Convert bytes to Qubic address format
   * @param {Buffer} bytes - Buffer containing address bytes
   * @returns {string} Qubic address string
   */
  async bytesToQubicAddress(bytes) {
    // try {
    //   if (!bytes || bytes.length === 0) {
    //     return null;
    //   }

    //   // Qubic addresses are 60 characters long and use a specific base32 encoding
    //   // The encoding uses the alphabet: ABCDEFGHIJKLMNOPQRSTUVWXYZ234567
    //   const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    //   let result = '';
      
    //   // Convert bytes to base32
    //   let value = 0;
    //   let bits = 0;
      
    //   for (let i = 0; i < bytes.length; i++) {
    //     value = (value << 8) | bytes[i];
    //     bits += 8;
        
    //     while (bits >= 5) {
    //       result += base32Chars[(value >> (bits - 5)) & 31];
    //       bits -= 5;
    //     }
    //   }
      
    //   if (bits > 0) {
    //     result += base32Chars[(value << (5 - bits)) & 31];
    //   }
      
    //   // Pad to 60 characters (Qubic address length)
    //   while (result.length < 60) {
    //     result += 'A';
    //   }
      
    //   return result.substring(0, 60);
    // } catch (error) {
    //   console.error('❌ Error converting bytes to Qubic address:', error);
    //   return null;
    // }
    const id = await qHelper.getIdentity(bytes);
    return id;
  }

  /**
   * Convert bytes to BigInt
   * @param {Buffer} bytes - Buffer containing numeric data
   * @returns {BigInt} BigInt value
   */
  bytesToBigInt(bytes) {
    try {
      let result = BigInt(0);
      // Little-endian: least significant byte first
      for (let i = 0; i < bytes.length; i++) {
        result += BigInt(bytes[i]) << (BigInt(8) * BigInt(i));
      }
      return result;
    } catch (error) {
      console.error('❌ Error converting bytes to BigInt:', error);
      return BigInt(0);
    }
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
