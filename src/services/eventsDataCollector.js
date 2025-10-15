/**
 * Data Collection Service for Events
 * 
 * This service implements the two-step process:
 * 1. Collect and process data from Qubic RPC
 * 2. Serve processed data via /events endpoint
 */

const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');

class EventsDataCollector {
  constructor() {
    this.baseURL = process.env.QUBIC_RPC_URL || 'https://rpc.qubic.org/v1';
    this.liveTreeURL = process.env.QUBIC_LIVE_TREE_URL || 'https://live.qubic.org/v1';
    
    this.timeout = parseInt(process.env.QUBIC_RPC_TIMEOUT) || 30000;
    this.dataFile = path.join(__dirname, '..', 'data', 'events.json');
    this.stateFile = path.join(__dirname, '..', 'data', 'collection-state.json');
    this.addressesFile = path.join(__dirname, '..', 'data', 'active-addresses.json');
    
    this.client = axios.create({
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'DEXTools-Qubic-API/1.0.0'
      }
    });
    
    this.isCollecting = false;
    this.collectionInterval = null;
  }

  /**
   * Initialize the data collector
   */
  async initialize() {
    try {
      // Ensure data directory exists
      await this.ensureDataDirectory();
      
      // Load existing state or create new
      await this.loadState();
      
      console.log('📊 Events Data Collector initialized');
      console.log(`   Data file: ${this.dataFile}`);
      console.log(`   State file: ${this.stateFile}`);
      console.log(`   Addresses file: ${this.addressesFile}`);
      
    } catch (error) {
      console.error('❌ Failed to initialize Events Data Collector:', error.message);
      throw error;
    }
  }

  /**
   * Ensure data directory exists
   */
  async ensureDataDirectory() {
    const dataDir = path.dirname(this.dataFile);
    try {
      await fs.access(dataDir);
    } catch {
      await fs.mkdir(dataDir, { recursive: true });
      console.log(`📁 Created data directory: ${dataDir}`);
    }
  }

  /**
   * Load collection state from file
   */
  async loadState() {
    try {
      const stateData = await fs.readFile(this.stateFile, 'utf8');
      this.state = JSON.parse(stateData);
      console.log('📋 Loaded collection state:', this.state);
    } catch (error) {
      // Create initial state
      this.state = {
        lastCollectionTime: null,
        latestTick: 0,
        activeAddresses: [],
        addressStates: {}, // Track last processed tick for each address
        isFirstRun: true,
        cycleCount: 0,
        processedAddresses: 0,
        totalEventsFound: 0,
        lastCycleDuration: 0,
        totalCyclesCompleted: 0,
        averageCycleDuration: 0
      };
      await this.saveState();
      console.log('📋 Created initial collection state');
    }
  }

  /**
   * Save collection state to file
   */
  async saveState() {
    try {
      await fs.writeFile(this.stateFile, JSON.stringify(this.state, null, 2));
    } catch (error) {
      console.error('❌ Failed to save state:', error.message);
    }
  }

  /**
   * Start the data collection process
   */
  async startCollection() {
    if (this.isCollecting) {
      console.log('⚠️  Data collection is already running');
      return;
    }

    console.log('🚀 Starting events data collection...');
    this.isCollecting = true;

    try {
      // Run initial collection
      await this.runCollectionCycle();
      
      // Set up periodic collection (every 5 minutes)
      this.collectionInterval = setInterval(async () => {
        try {
          await this.runCollectionCycle();
        } catch (error) {
          console.error('❌ Collection cycle error:', error.message);
        }
      }, 5 * 60 * 1000); // 5 minutes
      
      console.log('✅ Data collection started successfully');
      
    } catch (error) {
      console.error('❌ Failed to start data collection:', error.message);
      this.isCollecting = false;
      throw error;
    }
  }

  /**
   * Stop the data collection process
   */
  stopCollection() {
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
      this.collectionInterval = null;
    }
    this.isCollecting = false;
    console.log('🛑 Data collection stopped');
  }

  /**
   * Run a single collection cycle
   */
  async runCollectionCycle() {
    const cycleStartTime = Date.now();
    this.state.cycleCount = (this.state.cycleCount || 0) + 1;
    
    console.log(`\n🔄 Starting collection cycle #${this.state.cycleCount}...`);
    
    try {
      // Step 1: Get latest tick
      const latestTick = await this.getLatestTick();
      console.log(`📊 Latest tick: ${latestTick}`);
      
      // Step 2: Get active addresses (with caching)
      const activeAddresses = await this.getActiveAddresses();
      console.log(`👥 Found ${activeAddresses.length} active addresses`);
      
      // Log cache info for monitoring
      const cacheInfo = await this.getAddressesCacheInfo();
      if (cacheInfo.exists) {
        console.log(`📊 Addresses cache: ${cacheInfo.totalAddresses} addresses, age: ${Math.round(cacheInfo.age / 60000)} minutes`);
      }
      
      // Step 3: Process transactions for each address
      const allEvents = [];
      let processedAddresses = 0;
      let totalEventsFound = 0;
      let addressesWithNoTransactions = 0;
      
      for (const address of activeAddresses) {
        try {
          const addressEvents = await this.processAddressTransactions(address, latestTick);
          allEvents.push(...addressEvents);
          totalEventsFound += addressEvents.length;
          processedAddresses++;
          
          // Progress indicator every 100 addresses
          if (processedAddresses % 100 === 0) {
            console.log(`📊 Progress: ${processedAddresses}/${activeAddresses.length} addresses processed, ${totalEventsFound} events found`);
          }
          
        } catch (error) {
          // Only log errors that are not 404 (which is normal for addresses with no transactions)
          if (!error.message.includes('404')) {
            console.error(`❌ Failed to process address ${address}:`, error.message);
          } else {
            addressesWithNoTransactions++;
          }
        }
      }
      
      console.log(`📊 Address processing completed: ${processedAddresses}/${activeAddresses.length} addresses, ${totalEventsFound} events found`);
      if (addressesWithNoTransactions > 0) {
        console.log(`ℹ️  ${addressesWithNoTransactions} addresses had no transactions (normal for inactive addresses)`);
      }
      
      // Step 4: Save events data
      if (allEvents.length > 0) {
        await this.saveEventsData(allEvents);
        console.log(`💾 Saved ${allEvents.length} events to file`);
      }
      
      // Step 5: Update state
      const cycleEndTime = Date.now();
      const cycleDuration = cycleEndTime - cycleStartTime;
      
      this.state.lastCollectionTime = new Date().toISOString();
      this.state.latestTick = latestTick;
      this.state.activeAddresses = activeAddresses;
      this.state.processedAddresses = processedAddresses;
      this.state.totalEventsFound = totalEventsFound;
      this.state.lastCycleDuration = cycleDuration;
      this.state.totalCyclesCompleted = (this.state.totalCyclesCompleted || 0) + 1;
      
      // Calculate average cycle duration
      const totalDuration = (this.state.averageCycleDuration || 0) * (this.state.totalCyclesCompleted - 1) + cycleDuration;
      this.state.averageCycleDuration = Math.round(totalDuration / this.state.totalCyclesCompleted);
      
      await this.saveState();
      
      console.log(`✅ Collection cycle #${this.state.cycleCount} completed in ${Math.round(cycleDuration / 1000)}s`);
      console.log(`📊 Cycle stats: ${processedAddresses} addresses, ${totalEventsFound} events, avg duration: ${Math.round(this.state.averageCycleDuration / 1000)}s`);
      
      // Step 6: Schedule next cycle
      await this.scheduleNextCycle();
      
    } catch (error) {
      console.error('❌ Collection cycle failed:', error.message);
      throw error;
    }
  }

  /**
   * Schedule the next collection cycle
   */
  async scheduleNextCycle() {
    try {
      // Check if we need to refresh active addresses
      const cacheInfo = await this.getAddressesCacheInfo();
      const shouldRefreshAddresses = !cacheInfo.exists || cacheInfo.age > 3600000; // 1 hour
      
      if (shouldRefreshAddresses) {
        console.log('🔄 Active addresses cache is stale, refreshing...');
        await this.refreshActiveAddressesCache();
      }
      
      // Get updated active addresses for next cycle
      const updatedAddresses = await this.getActiveAddresses();
      console.log(`📊 Next cycle will process ${updatedAddresses.length} active addresses`);
      
      // Update state with new addresses
      this.state.activeAddresses = updatedAddresses;
      await this.saveState();
      
      console.log('⏰ Next collection cycle scheduled');
      
    } catch (error) {
      console.error('❌ Failed to schedule next cycle:', error.message);
    }
  }

  /**
   * Get latest tick from Qubic RPC
   */
  async getLatestTick() {
    try {
      const response = await this.client.get(`${this.baseURL}/tick-info`);
      const tick = response.data.tickInfo?.tick || response.data.tick || 0;
      return parseInt(tick);
    } catch (error) {
      throw new Error(`Failed to get latest tick: ${error.message}`);
    }
  }

  /**
   * Get active addresses from Qubic RPC API with file-based caching
   */
  async getActiveAddresses() {
    try {
      // First, try to load from file
      const cachedAddresses = await this.loadActiveAddressesFromFile();
      
      if (cachedAddresses && cachedAddresses.length > 0) {
        console.log(`📊 Loaded ${cachedAddresses.length} cached active addresses from file`);
        
        // Check if we have a complete address list (should be ~594,723 addresses)
        const expectedMinAddresses = 500000; // Minimum expected addresses
        if (cachedAddresses.length < expectedMinAddresses) {
          console.log(`⚠️  Cached addresses incomplete (${cachedAddresses.length} < ${expectedMinAddresses}), refreshing...`);
        } else {
          // Check if cache is still fresh (less than 1 hour old)
          const cacheAge = await this.getAddressesCacheAge();
          if (cacheAge < 3600000) { // 1 hour in milliseconds
            console.log(`✅ Using cached addresses (age: ${Math.round(cacheAge / 60000)} minutes)`);
            return cachedAddresses;
          } else {
            console.log(`⚠️  Cached addresses are stale (age: ${Math.round(cacheAge / 60000)} minutes), refreshing...`);
          }
        }
      }
      
      // If no cache or cache is stale, fetch fresh data
      console.log('📊 Fetching fresh active addresses from Qubic RPC...');
      const freshAddresses = await this.fetchActiveAddressesFromRPC();
      
      if (freshAddresses && freshAddresses.length > 0) {
        // Save to file for future use
        await this.saveActiveAddressesToFile(freshAddresses);
        console.log(`✅ Saved ${freshAddresses.length} active addresses to file`);
        return freshAddresses;
      } else {
        // If fresh fetch failed, try to use cached data as fallback
        if (cachedAddresses && cachedAddresses.length > 0) {
          console.log(`⚠️  Fresh fetch failed, using stale cached addresses (${cachedAddresses.length} addresses)`);
          return cachedAddresses;
        }
        console.log('❌ No addresses available (fresh fetch failed and no cache)');
        return [];
      }
      
    } catch (error) {
      console.error('❌ Failed to get active addresses:', error.message);
      
      // Try to load from file as fallback
      try {
        const cachedAddresses = await this.loadActiveAddressesFromFile();
        if (cachedAddresses && cachedAddresses.length > 0) {
          console.log(`⚠️  Using cached addresses as fallback (${cachedAddresses.length} addresses)`);
          return cachedAddresses;
        }
      } catch (cacheError) {
        console.error('❌ Failed to load cached addresses:', cacheError.message);
      }
      
      return [];
    }
  }

  /**
   * Fetch active addresses from Qubic RPC API with resume capability
   */
  async fetchActiveAddressesFromRPC(resumeFromPage = 1) {
    try {
      const addresses = new Set();
      
      // Get latest stats to get active addresses count
      console.log('📊 Getting latest stats...');
      const latestStatsResponse = await this.client.get(`${this.baseURL}/latest-stats`);
      const latestStats = latestStatsResponse.data;
      
      console.log(`📊 Latest stats: ${latestStats.data?.activeAddresses || 0} active addresses`);
      
      // Get rich list data with pagination
      console.log('📊 Getting rich list data...');
      const totalRecords = latestStats.data?.activeAddresses || 0;
      const pageSize = 100;
      const totalPages = Math.ceil(totalRecords / pageSize);
      
      console.log(`📊 Total active addresses: ${totalRecords}`);
      console.log(`📊 Total pages to fetch: ${totalPages} (${pageSize} addresses per page)`);
      
      // Fetch all pages to get complete address list
      const maxPages = totalPages;
      
      // If resuming, load existing addresses first
      if (resumeFromPage > 1) {
        console.log(`📊 Resuming from page ${resumeFromPage}, loading existing addresses...`);
        const existingAddresses = await this.loadActiveAddressesFromFile();
        existingAddresses.forEach(addr => addresses.add(addr));
        console.log(`📊 Loaded ${existingAddresses.length} existing addresses`);
      }
      
      let successCount = 0;
      let errorCount = 0;
      const startTime = Date.now();
      
      for (let page = resumeFromPage; page <= maxPages; page++) {
        try {
          // Progress indicator every 100 pages
          if (page % 100 === 0 || page === 1) {
            const elapsed = Math.round((Date.now() - startTime) / 1000);
            const progress = Math.round((page / maxPages) * 100);
            console.log(`📊 Progress: ${page}/${maxPages} (${progress}%) - ${addresses.size} addresses collected - ${elapsed}s elapsed`);
          }
          
          const richListResponse = await this.client.get(`${this.baseURL}/rich-list`, {
            params: {
              page: page,
              pageSize: pageSize
            }
          });
          
          const richListData = richListResponse.data;
          
          // Add addresses from rich list
          if (richListData.richList?.entities) {
            richListData.richList.entities.forEach(entity => {
              if (entity.identity) {
                addresses.add(entity.identity);
              }
            });
            successCount++;
          }
          
          // Adaptive delay to avoid rate limiting
          // Longer delay for every 50 pages to be respectful to the API
          const delay = page % 50 === 0 ? 500 : 100;
          await new Promise(resolve => setTimeout(resolve, delay));
          
        } catch (pageError) {
          errorCount++;
          console.error(`❌ Failed to fetch page ${page}:`, pageError.message);
          
          // If we get too many consecutive errors, stop
          if (errorCount > 10) {
            console.error(`❌ Too many errors (${errorCount}), stopping fetch process`);
            break;
          }
          
          // Longer delay after errors
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      const totalTime = Math.round((Date.now() - startTime) / 1000);
      console.log(`📊 Fetch completed: ${successCount} successful pages, ${errorCount} errors, ${totalTime}s total time`);
      
      // Save progress every 1000 addresses to prevent data loss
      if (addresses.size > 0 && addresses.size % 1000 === 0) {
        const addressArray = Array.from(addresses);
        await this.saveActiveAddressesToFile(addressArray);
        console.log(`💾 Progress saved: ${addresses.size} addresses`);
      }
      
      const addressArray = Array.from(addresses);
      console.log(`✅ Total addresses collected from RPC: ${addressArray.length}`);
      
      return addressArray;
      
    } catch (error) {
      console.error('❌ Failed to fetch active addresses from RPC:', error.message);
      throw error;
    }
  }

  /**
   * Load active addresses from file
   */
  async loadActiveAddressesFromFile() {
    try {
      const data = await fs.readFile(this.addressesFile, 'utf8');
      const parsedData = JSON.parse(data);
      
      if (parsedData.addresses && Array.isArray(parsedData.addresses)) {
        return parsedData.addresses;
      }
      
      return [];
    } catch (error) {
      // File doesn't exist or is invalid, return empty array
      return [];
    }
  }

  /**
   * Save active addresses to file
   */
  async saveActiveAddressesToFile(addresses) {
    try {
      const dataToSave = {
        addresses: addresses,
        lastUpdated: new Date().toISOString(),
        totalAddresses: addresses.length,
        source: 'qubic-rpc'
      };
      
      await fs.writeFile(this.addressesFile, JSON.stringify(dataToSave, null, 2));
      console.log(`💾 Saved ${addresses.length} active addresses to ${this.addressesFile}`);
      
    } catch (error) {
      console.error('❌ Failed to save active addresses to file:', error.message);
      throw error;
    }
  }

  /**
   * Get the age of the addresses cache in milliseconds
   */
  async getAddressesCacheAge() {
    try {
      const data = await fs.readFile(this.addressesFile, 'utf8');
      const parsedData = JSON.parse(data);
      
      if (parsedData.lastUpdated) {
        const lastUpdated = new Date(parsedData.lastUpdated);
        const now = new Date();
        return now.getTime() - lastUpdated.getTime();
      }
      
      return Infinity; // No timestamp, consider it very old
    } catch (error) {
      return Infinity; // File doesn't exist or is invalid, consider it very old
    }
  }

  /**
   * Manually refresh active addresses cache
   */
  async refreshActiveAddressesCache(resumeFromPage = 1) {
    try {
      console.log(`🔄 Manually refreshing active addresses cache${resumeFromPage > 1 ? ` from page ${resumeFromPage}` : ''}...`);
      const freshAddresses = await this.fetchActiveAddressesFromRPC(resumeFromPage);
      
      if (freshAddresses && freshAddresses.length > 0) {
        await this.saveActiveAddressesToFile(freshAddresses);
        console.log(`✅ Successfully refreshed cache with ${freshAddresses.length} addresses`);
        return freshAddresses;
      } else {
        console.log('❌ Failed to refresh cache - no addresses received');
        return [];
      }
    } catch (error) {
      console.error('❌ Failed to refresh active addresses cache:', error.message);
      throw error;
    }
  }

  /**
   * Force refresh all active addresses (ignores cache)
   */
  async forceRefreshAllAddresses() {
    try {
      console.log('🔄 Force refreshing ALL active addresses (ignoring cache)...');
      
      // Delete existing cache file
      try {
        await fs.unlink(this.addressesFile);
        console.log('🗑️  Deleted existing cache file');
      } catch (error) {
        // File doesn't exist, that's fine
      }
      
      // Fetch fresh data
      const freshAddresses = await this.fetchActiveAddressesFromRPC();
      
      if (freshAddresses && freshAddresses.length > 0) {
        await this.saveActiveAddressesToFile(freshAddresses);
        console.log(`✅ Successfully force refreshed cache with ${freshAddresses.length} addresses`);
        return freshAddresses;
      } else {
        console.log('❌ Failed to force refresh cache - no addresses received');
        return [];
      }
    } catch (error) {
      console.error('❌ Failed to force refresh active addresses cache:', error.message);
      throw error;
    }
  }

  /**
   * Get fetch progress information
   */
  async getFetchProgress() {
    try {
      const latestStatsResponse = await this.client.get(`${this.baseURL}/latest-stats`);
      const latestStats = latestStatsResponse.data;
      const totalRecords = latestStats.data?.activeAddresses || 0;
      const pageSize = 100;
      const totalPages = Math.ceil(totalRecords / pageSize);
      
      const cacheInfo = await this.getAddressesCacheInfo();
      const currentCount = cacheInfo.totalAddresses || 0;
      const estimatedCurrentPage = Math.ceil(currentCount / pageSize);
      
      return {
        totalAddresses: totalRecords,
        totalPages: totalPages,
        currentAddresses: currentCount,
        estimatedCurrentPage: estimatedCurrentPage,
        progressPercentage: Math.round((currentCount / totalRecords) * 100),
        remainingPages: totalPages - estimatedCurrentPage,
        cacheAge: cacheInfo.age
      };
    } catch (error) {
      console.error('❌ Failed to get fetch progress:', error.message);
      return null;
    }
  }

  /**
   * Get cycling statistics
   */
  async getCyclingStats() {
    try {
      const cacheInfo = await this.getAddressesCacheInfo();
      
      return {
        cycleCount: this.state.cycleCount || 0,
        totalCyclesCompleted: this.state.totalCyclesCompleted || 0,
        lastCollectionTime: this.state.lastCollectionTime,
        lastCycleDuration: this.state.lastCycleDuration || 0,
        averageCycleDuration: this.state.averageCycleDuration || 0,
        processedAddresses: this.state.processedAddresses || 0,
        totalEventsFound: this.state.totalEventsFound || 0,
        activeAddressesCount: this.state.activeAddresses?.length || 0,
        addressesCacheAge: cacheInfo.age,
        isCollecting: this.isCollecting,
        nextCycleScheduled: this.collectionInterval !== null
      };
    } catch (error) {
      console.error('❌ Failed to get cycling stats:', error.message);
      return null;
    }
  }

  /**
   * Get addresses cache info
   */
  async getAddressesCacheInfo() {
    try {
      const data = await fs.readFile(this.addressesFile, 'utf8');
      const parsedData = JSON.parse(data);
      
      return {
        exists: true,
        lastUpdated: parsedData.lastUpdated,
        totalAddresses: parsedData.totalAddresses || 0,
        source: parsedData.source || 'unknown',
        age: await this.getAddressesCacheAge()
      };
    } catch (error) {
      return {
        exists: false,
        lastUpdated: null,
        totalAddresses: 0,
        source: 'none',
        age: Infinity
      };
    }
  }

  /**
   * Process transactions for a specific address
   */
  async processAddressTransactions(address, latestTick) {
    try {
      // Get start tick for this address
      let startTick = this.state.addressStates[address]?.lastProcessedTick || latestTick;
      
      // For first run, start from a reasonable point
      if (this.state.isFirstRun) {
        startTick = Math.max(0, latestTick - 1000); // Last 1000 ticks
      }
      
      // Get transactions for this address
      const transactions = await this.getAddressTransactions(address, startTick, latestTick);
      
      // Process transactions into events
      const events = [];
      let eventIndex = 0;
      
      for (const tx of transactions) {
        try {
          const event = await this.processTransaction(tx, eventIndex++);
          if (event) {
            events.push(event);
          }
        } catch (error) {
          console.error(`❌ Failed to process transaction ${tx.txId}:`, error.message);
        }
      }
      
      // Update address state
      this.state.addressStates[address] = {
        lastProcessedTick: latestTick,
        lastProcessedTime: new Date().toISOString()
      };
      
      return events;
      
    } catch (error) {
      throw new Error(`Failed to process transactions for ${address}: ${error.message}`);
    }
  }

  /**
   * Get transactions for an address in tick range
   */
  async getAddressTransactions(address, startTick, endTick) {
    try {
      const response = await this.client.get(`${this.baseURL}/identities/${address}/transfer-transactions`, {
        params: {
          startTick,
          endTick
        }
      });
      
      // Handle the response structure from transfer-transactions endpoint
      if (response.data.transferTransactionsPerTick) {
        // Flatten transactions from all ticks
        const allTransactions = [];
        response.data.transferTransactionsPerTick.forEach(tickData => {
          if (tickData.transactions) {
            allTransactions.push(...tickData.transactions);
          }
        });
        return allTransactions;
      }
      
      return response.data.transactions || [];
      
    } catch (error) {
      // If 404 error, it means the address has no transactions, which is normal
      if (error.response && error.response.status === 404) {
        console.log(`ℹ️  No transactions found for address ${address} (404 - normal for inactive addresses)`);
        return [];
      }
      throw new Error(`Failed to get transactions for ${address}: ${error.message}`);
    }
  }

  /**
   * Process a single transaction into an event
   */
  async processTransaction(tx, eventIndex) {
    try {
      // Filter for swap transactions (eventType: swap)
      if (!this.isSwapTransaction(tx)) {
        return null;
      }
      
      // Extract data from transaction
      const pairId = this.extractPairId(tx);
      const asset0In = this.extractAsset0In(tx);
      const asset1Out = this.extractAsset1Out(tx);
      
      if (!pairId || !asset0In || !asset1Out) {
        return null;
      }
      
      // Get reserves data
      const reserves = await this.getReservesData(pairId);
      
      // Create event object
      const event = {
        block: {
          blockNumber: tx.tickNumber,
          blockTimestamp: tx.timestamp || Math.floor(Date.now() / 1000)
        },
        txnId: tx.txId,
        txnIndex: tx.txnIndex || 0,
        eventIndex: eventIndex,
        maker: tx.sourceId || tx.sourceIdentity,
        pairId: pairId,
        eventType: 'swap',
        asset0In: asset0In,
        asset1Out: asset1Out,
        reserves: reserves
      };
      
      return event;
      
    } catch (error) {
      console.error(`❌ Failed to process transaction:`, error.message);
      return null;
    }
  }

  /**
   * Check if transaction is a swap transaction
   */
  isSwapTransaction(tx) {
    // Check if it's a transfer to QX address with specific amount patterns
    const qxAddress = 'BAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAARMID';
    return tx.destId === qxAddress && 
           tx.inputType === 2 && 
           tx.inputSize > 0 &&
           tx.inputHex && tx.inputHex.length > 0;
  }

  /**
   * Extract pair ID from transaction
   */
  extractPairId(tx) {
    try {
      // Parse inputHex to extract token issuer (pair ID)
      // This is a simplified extraction - you may need to adjust based on actual data structure
      if (tx.inputHex && tx.inputHex.length >= 32) {
        // Extract issuer from inputHex (first 32 characters)
        return tx.inputHex.substring(0, 32);
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Extract asset0 input amount (QUBIC)
   */
  extractAsset0In(tx) {
    return tx.amount || '0';
  }

  /**
   * Extract asset1 output amount (token)
   */
  extractAsset1Out(tx) {
    try {
      // Parse inputHex to extract token amount
      // This is a simplified extraction - you may need to adjust based on actual data structure
      if (tx.inputHex && tx.inputHex.length >= 64) {
        // Extract amount from inputHex (bytes 32-64)
        const amountHex = tx.inputHex.substring(32, 64);
        return parseInt(amountHex, 16).toString();
      }
      return '0';
    } catch (error) {
      return '0';
    }
  }

  /**
   * Get reserves data using smart contract query
   */
  async getReservesData(pairId) {
    try {
      // Encode the request data for AssetAskOrders_input
      const requestData = this.encodeAssetAskOrdersInput(pairId);
      
      const response = await this.client.post(`${this.liveTreeURL}/query-smart-contract`, {
        contractIndex: 1,
        inputType: 2,
        inputSize: 48,
        requestData: requestData
      });
      
      // Decode response to get numberOfShares
      const reserves = this.decodeReservesResponse(response.data);
      
      return reserves;
      
    } catch (error) {
      console.error(`❌ Failed to get reserves for ${pairId}:`, error.message);
      return {
        asset0: '0',
        asset1: '0'
      };
    }
  }

  /**
   * Encode AssetAskOrders_input struct
   */
  encodeAssetAskOrdersInput(pairId) {
    try {
      // This is a simplified encoding - you may need to adjust based on actual struct definition
      const issuer = pairId.padEnd(32, '0'); // Pad to 32 bytes
      const assetName = '0'.repeat(16); // 8 bytes for assetName
      const offset = '0'.repeat(16); // 8 bytes for offset
      
      const combined = issuer + assetName + offset;
      return Buffer.from(combined, 'hex').toString('base64');
      
    } catch (error) {
      console.error('❌ Failed to encode request data:', error.message);
      return '';
    }
  }

  /**
   * Decode reserves response
   */
  decodeReservesResponse(responseData) {
    try {
      // This is a simplified decoding - you may need to adjust based on actual response structure
      // Sum up numberOfShares for each token
      let asset0Total = 0;
      let asset1Total = 0;
      
      if (responseData.results) {
        responseData.results.forEach(result => {
          if (result.numberOfShares) {
            // Determine which asset this is based on context
            // This logic may need adjustment based on actual data structure
            asset0Total += parseInt(result.numberOfShares) || 0;
            asset1Total += parseInt(result.numberOfShares) || 0;
          }
        });
      }
      
      return {
        asset0: asset0Total.toString(),
        asset1: asset1Total.toString()
      };
      
    } catch (error) {
      console.error('❌ Failed to decode reserves response:', error.message);
      return {
        asset0: '0',
        asset1: '0'
      };
    }
  }

  /**
   * Save events data to file
   */
  async saveEventsData(events) {
    try {
      // Load existing events
      let existingEvents = [];
      try {
        const existingData = await fs.readFile(this.dataFile, 'utf8');
        existingEvents = JSON.parse(existingData).events || [];
      } catch {
        // File doesn't exist, start with empty array
      }
      
      // Merge new events with existing ones
      const allEvents = [...existingEvents, ...events];
      
      // Remove duplicates based on txnId and eventIndex
      const uniqueEvents = this.removeDuplicateEvents(allEvents);
      
      // Sort by block number and event index
      uniqueEvents.sort((a, b) => {
        if (a.block.blockNumber !== b.block.blockNumber) {
          return a.block.blockNumber - b.block.blockNumber;
        }
        return a.eventIndex - b.eventIndex;
      });
      
      // Save to file
      const dataToSave = {
        events: uniqueEvents,
        lastUpdated: new Date().toISOString(),
        totalEvents: uniqueEvents.length
      };
      
      await fs.writeFile(this.dataFile, JSON.stringify(dataToSave, null, 2));
      
    } catch (error) {
      console.error('❌ Failed to save events data:', error.message);
      throw error;
    }
  }

  /**
   * Remove duplicate events
   */
  removeDuplicateEvents(events) {
    const seen = new Set();
    return events.filter(event => {
      const key = `${event.txnId}-${event.eventIndex}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * Get events data for API response
   */
  async getEventsData(fromBlock, toBlock) {
    try {
      const data = await fs.readFile(this.dataFile, 'utf8');
      const parsedData = JSON.parse(data);
      
      let events = parsedData.events || [];
      
      // Filter by block range if specified
      if (fromBlock !== undefined) {
        events = events.filter(event => event.block.blockNumber >= fromBlock);
      }
      
      if (toBlock !== undefined) {
        events = events.filter(event => event.block.blockNumber <= toBlock);
      }
      
      return events;
      
    } catch (error) {
      console.error('❌ Failed to get events data:', error.message);
      return [];
    }
  }
}

module.exports = EventsDataCollector;
