/**
 * Events Data Collection Manager
 * 
 * This service manages the initialization and lifecycle of the events data collector
 */

const EventsDataCollector = require('./eventsDataCollector');

class EventsDataManager {
  constructor() {
    this.collector = null;
    this.isInitialized = false;
    this.initializationStatus = 'not_started';
  }

  /**
   * Initialize the events data collection system
   */
  async initialize() {
    if (this.isInitialized) {
      console.log('⚠️  Events data manager already initialized');
      return;
    }

    try {
      console.log('🚀 Initializing Events Data Collection System...');
      this.initializationStatus = 'starting';
      
      // Create and initialize the collector
      this.collector = new EventsDataCollector();
      await this.collector.initialize();
      
      this.initializationStatus = 'collector_ready';
      console.log('✅ Events Data Collector initialized, starting background collection...');
      
      // Start data collection in background (non-blocking)
      this.startCollectionInBackground();
      
      this.isInitialized = true;
      console.log('✅ Events Data Collection System initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize Events Data Collection System:', error.message);
      this.initializationStatus = 'failed';
      throw error;
    }
  }

  /**
   * Start data collection in background
   */
  async startCollectionInBackground() {
    try {
      this.initializationStatus = 'starting_collection';
      await this.collector.startCollection();
      this.initializationStatus = 'running';
      console.log('✅ Background data collection started successfully');
    } catch (error) {
      console.error('❌ Failed to start background data collection:', error.message);
      this.initializationStatus = 'collection_failed';
    }
  }

  /**
   * Stop the events data collection system
   */
  stop() {
    if (this.collector) {
      this.collector.stopCollection();
    }
    this.isInitialized = false;
    console.log('🛑 Events Data Collection System stopped');
  }

  /**
   * Get the collector instance
   */
  getCollector() {
    if (!this.isInitialized) {
      throw new Error('Events Data Manager not initialized');
    }
    return this.collector;
  }

  /**
   * Check if the system is running
   */
  isRunning() {
    return this.isInitialized && this.collector && this.collector.isCollecting;
  }

  /**
   * Get collection status
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      isCollecting: this.isRunning(),
      collector: this.collector ? {
        isCollecting: this.collector.isCollecting,
        lastCollectionTime: this.collector.state?.lastCollectionTime,
        latestTick: this.collector.state?.latestTick,
        activeAddressesCount: this.collector.state?.activeAddresses?.length || 0
      } : null
    };
  }

  /**
   * Get initialization status
   */
  getInitializationStatus() {
    return {
      status: this.initializationStatus,
      isInitialized: this.isInitialized,
      isRunning: this.isRunning(),
      collectorReady: !!this.collector,
      timestamp: new Date().toISOString()
    };
  }
}

// Create singleton instance
const eventsDataManager = new EventsDataManager();

module.exports = eventsDataManager;

