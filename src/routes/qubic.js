const express = require('express');
const { QubicClient } = require('../services/qubicClient');
const { validateParams, validateQuery } = require('../middleware/validation');

const router = express.Router();
const qubicClient = new QubicClient();

/**
 * @route GET /api/v1/latest-block
 * @desc Get the latest block information
 * @access Public
 */
router.get('/latest-block', async (req, res, next) => {
  try {
    const latestBlock = await qubicClient.getLatestBlock();
    
    // Return data in DEXTools format
    res.json(latestBlock);
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/v1/block/:identifier
 * @desc Get block by number or timestamp
 * @access Public
 */
router.get('/block/:identifier', validateParams(['identifier']), async (req, res, next) => {
  try {
    const { identifier } = req.params;
    const block = await qubicClient.getBlock(identifier);
    
    // Return data in DEXTools format
    res.json(block);
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/v1/asset/holders
 * @desc Get asset holders with pagination
 * @access Public
 */
router.get('/asset/holders', validateQuery(['id', 'page', 'pageSize']), async (req, res, next) => {
  try {
    const { id, page = 1, pageSize = 10 } = req.query;
    const holders = await qubicClient.getAssetHolders(id, parseInt(page), parseInt(pageSize));
    
    // Return data in DEXTools format
    res.json(holders);
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/v1/asset/:assetId
 * @desc Get asset/token information by ID
 * @access Public
 */
router.get('/asset/:assetId', validateParams(['assetId']), async (req, res, next) => {
  try {
    const { assetId } = req.params;
    const asset = await qubicClient.getAsset(assetId);
    
    // Return data in DEXTools format
    res.json(asset);
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/v1/exchange
 * @desc Get exchange/DEX information by ID or factory address (query parameter)
 * @access Public
 */
router.get('/exchange', validateQuery(['id']), async (req, res, next) => {
  try {
    const { id } = req.query;
    const exchange = await qubicClient.getExchange(id);
    
    // Return data in DEXTools format
    res.json(exchange);
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/v1/exchange/:exchangeId
 * @desc Get exchange/DEX information by ID or factory address (path parameter)
 * @access Public
 */
router.get('/exchange/:exchangeId', validateParams(['exchangeId']), async (req, res, next) => {
  try {
    const { exchangeId } = req.params;
    const exchange = await qubicClient.getExchange(exchangeId);
    
    // Return data in DEXTools format
    res.json(exchange);
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/v1/pair/:pairId
 * @desc Get trading pair information by ID
 * @access Public
 */
router.get('/pair/:pairId', validateParams(['pairId']), async (req, res, next) => {
  try {
    const { pairId } = req.params;
    const pair = await qubicClient.getPair(pairId);
    
    // Return data in DEXTools format
    res.json(pair);
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/v1/events
 * @desc Get events (transactions, swaps, etc.) with optional filters
 * @access Public
 */
router.get('/events', async (req, res, next) => {
  try {
    const filters = {
      page: req.query.page || 1,
      limit: req.query.limit || 100,
      type: req.query.type,
      from: req.query.from,
      to: req.query.to,
      asset: req.query.asset,
      pair: req.query.pair,
      exchange: req.query.exchange,
      startTime: req.query.startTime,
      endTime: req.query.endTime
    };

    // Remove undefined values
    Object.keys(filters).forEach(key => {
      if (filters[key] === undefined) {
        delete filters[key];
      }
    });

    const events = await qubicClient.getEvents(filters);
    
    // Return data in DEXTools format
    res.json(events);
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/v1/docs
 * @desc API documentation
 * @access Public
 */
router.get('/docs', (req, res) => {
  const docs = {
    title: 'DEXTools Qubic API',
    version: '1.0.0',
    description: 'API for integrating Qubic blockchain data with DEXTools platform',
    baseUrl: `${req.protocol}://${req.get('host')}/api/v1`,
    endpoints: [
      {
        method: 'GET',
        path: '/latest-block',
        description: 'Get the latest block information',
        parameters: [],
        example: '/api/v1/latest-block'
      },
      {
        method: 'GET',
        path: '/block/:identifier',
        description: 'Get block by number or timestamp',
        parameters: [
          {
            name: 'identifier',
            type: 'string|number',
            required: true,
            description: 'Block number or timestamp'
          }
        ],
        example: '/api/v1/block/12345'
      },
      {
        method: 'GET',
        path: '/asset/:assetId',
        description: 'Get asset/token information by ID',
        parameters: [
          {
            name: 'assetId',
            type: 'string',
            required: true,
            description: 'Asset ID or contract address'
          }
        ],
        example: '/api/v1/asset/0x1234...'
      },
      {
        method: 'GET',
        path: '/exchange/:exchangeId',
        description: 'Get exchange/DEX information by ID or factory address',
        parameters: [
          {
            name: 'exchangeId',
            type: 'string',
            required: true,
            description: 'Exchange ID or factory address'
          }
        ],
        example: '/api/v1/exchange/0x5678...'
      },
      {
        method: 'GET',
        path: '/pair/:pairId',
        description: 'Get trading pair information by ID',
        parameters: [
          {
            name: 'pairId',
            type: 'string',
            required: true,
            description: 'Pair ID'
          }
        ],
        example: '/api/v1/pair/pair123'
      },
      {
        method: 'GET',
        path: '/events',
        description: 'Get events with optional filters',
        parameters: [
          {
            name: 'page',
            type: 'number',
            required: false,
            description: 'Page number (default: 1)'
          },
          {
            name: 'limit',
            type: 'number',
            required: false,
            description: 'Items per page (default: 100)'
          },
          {
            name: 'type',
            type: 'string',
            required: false,
            description: 'Event type filter'
          },
          {
            name: 'from',
            type: 'string',
            required: false,
            description: 'From address filter'
          },
          {
            name: 'to',
            type: 'string',
            required: false,
            description: 'To address filter'
          },
          {
            name: 'asset',
            type: 'string',
            required: false,
            description: 'Asset filter'
          },
          {
            name: 'pair',
            type: 'string',
            required: false,
            description: 'Pair filter'
          },
          {
            name: 'exchange',
            type: 'string',
            required: false,
            description: 'Exchange filter'
          },
          {
            name: 'startTime',
            type: 'number',
            required: false,
            description: 'Start timestamp filter'
          },
          {
            name: 'endTime',
            type: 'number',
            required: false,
            description: 'End timestamp filter'
          }
        ],
        example: '/api/v1/events?page=1&limit=50&type=swap'
      }
    ],
    responseFormat: {
      success: 'boolean',
      data: 'object|array',
      timestamp: 'string (ISO 8601)',
      error: 'string (only on error)'
    }
  };

  res.json(docs);
});

module.exports = router;
