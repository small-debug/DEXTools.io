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
 * @route GET /api/v1/block
 * @desc Get block by number (query parameter)
 * @access Public
 */
router.get('/block', async (req, res, next) => {
  try {
    const { number } = req.query;
    
    if (!number) {
      return res.status(400).json({
        success: false,
        error: 'Missing required query parameter: number',
        timestamp: new Date().toISOString()
      });
    }
    
    const block = await qubicClient.getBlock(number);
    
    // Return data in DEXTools format
    res.json(block);
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/v1/block/:identifier
 * @desc Get block by number or timestamp (path parameter)
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
 * @route GET /api/v1/asset
 * @desc Get asset/token information by ID (query parameter)
 * @access Public
 */
router.get('/asset', async (req, res, next) => {
  try {
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Missing required query parameter: id',
        timestamp: new Date().toISOString()
      });
    }
    
    const asset = await qubicClient.getAsset(id);
    
    // Return data in DEXTools format
    res.json(asset);
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/v1/asset/:assetId
 * @desc Get asset/token information by ID (path parameter)
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
router.get('/exchange', async (req, res, next) => {
  try {
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Missing required query parameter: id',
        timestamp: new Date().toISOString()
      });
    }
    
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
 * @route GET /api/v1/pair
 * @desc Get trading pair information by ID (query parameter)
 * @access Public
 */
router.get('/pair', async (req, res, next) => {
  try {
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Missing required query parameter: id',
        timestamp: new Date().toISOString()
      });
    }
    
    const pair = await qubicClient.getPair(id);
    
    // Return data in DEXTools format
    res.json(pair);
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/v1/pair/:pairId
 * @desc Get trading pair information by ID (path parameter)
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
 * @desc Get events (transactions, swaps, etc.) in a range of blocks
 * @access Public
 */
router.get('/events', async (req, res, next) => {
  try {
    const { fromBlock, toBlock } = req.query;
    
    if (!fromBlock || !toBlock) {
      return res.status(400).json({
        success: false,
        error: 'Missing required query parameters: fromBlock and toBlock',
        timestamp: new Date().toISOString()
      });
    }

    const events = await qubicClient.getEventsInTickRange(parseInt(fromBlock), parseInt(toBlock));
    
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
        path: '/block',
        description: 'Get block by number (query parameter)',
        parameters: [
          {
            name: 'number',
            type: 'string|number',
            required: true,
            description: 'Block number',
            in: 'query'
          }
        ],
        example: '/api/v1/block?number=12345'
      },
      {
        method: 'GET',
        path: '/block/:identifier',
        description: 'Get block by number or timestamp (path parameter)',
        parameters: [
          {
            name: 'identifier',
            type: 'string|number',
            required: true,
            description: 'Block number or timestamp',
            in: 'path'
          }
        ],
        example: '/api/v1/block/12345'
      },
      {
        method: 'GET',
        path: '/asset',
        description: 'Get asset/token information by ID (query parameter)',
        parameters: [
          {
            name: 'id',
            type: 'string',
            required: true,
            description: 'Asset ID or contract address',
            in: 'query'
          }
        ],
        example: '/api/v1/asset?id=0x1234...'
      },
      {
        method: 'GET',
        path: '/asset/:assetId',
        description: 'Get asset/token information by ID (path parameter)',
        parameters: [
          {
            name: 'assetId',
            type: 'string',
            required: true,
            description: 'Asset ID or contract address',
            in: 'path'
          }
        ],
        example: '/api/v1/asset/0x1234...'
      },
      {
        method: 'GET',
        path: '/exchange',
        description: 'Get exchange/DEX information by ID or factory address (query parameter)',
        parameters: [
          {
            name: 'id',
            type: 'string',
            required: true,
            description: 'Exchange ID or factory address',
            in: 'query'
          }
        ],
        example: '/api/v1/exchange?id=0x5678...'
      },
      {
        method: 'GET',
        path: '/exchange/:exchangeId',
        description: 'Get exchange/DEX information by ID or factory address (path parameter)',
        parameters: [
          {
            name: 'exchangeId',
            type: 'string',
            required: true,
            description: 'Exchange ID or factory address',
            in: 'path'
          }
        ],
        example: '/api/v1/exchange/0x5678...'
      },
      {
        method: 'GET',
        path: '/pair',
        description: 'Get trading pair information by ID (query parameter)',
        parameters: [
          {
            name: 'id',
            type: 'string',
            required: true,
            description: 'Pair ID (identity address)',
            in: 'query'
          }
        ],
        example: '/api/v1/pair?id=PAIRADDRESSEXAMPLE'
      },
      {
        method: 'GET',
        path: '/pair/:pairId',
        description: 'Get trading pair information by ID (path parameter)',
        parameters: [
          {
            name: 'pairId',
            type: 'string',
            required: true,
            description: 'Pair ID (identity address)',
            in: 'path'
          }
        ],
        example: '/api/v1/pair/PAIRADDRESSEXAMPLE'
      },
      {
        method: 'GET',
        path: '/events',
        description: 'Get events (transactions, swaps, etc.) in a range of blocks',
        parameters: [
          {
            name: 'fromBlock',
            type: 'integer',
            required: true,
            description: 'Start block number (tick number)',
            in: 'query'
          },
          {
            name: 'toBlock',
            type: 'integer',
            required: true,
            description: 'End block number (tick number)',
            in: 'query'
          }
        ],
        example: '/api/v1/events?fromBlock=34776300&toBlock=34776700'
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
