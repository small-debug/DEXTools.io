const request = require('supertest');
const app = require('../src/index');

describe('DEXTools Qubic API', () => {
  describe('GET /health', () => {
    it('should return health status', async () => {
      const res = await request(app)
        .get('/health')
        .expect(200);

      expect(res.body).toHaveProperty('status', 'OK');
      expect(res.body).toHaveProperty('timestamp');
      expect(res.body).toHaveProperty('uptime');
    });
  });

  describe('GET /api/v1/latest-block', () => {
    it('should return latest block data in DEXTools format', async () => {
      const res = await request(app)
        .get('/api/v1/latest-block')
        .expect(200);

      expect(res.body).toHaveProperty('block');
      expect(res.body.block).toHaveProperty('blockNumber');
      expect(res.body.block).toHaveProperty('blockTimestamp');
      expect(typeof res.body.block.blockNumber).toBe('number');
      expect(typeof res.body.block.blockTimestamp).toBe('number');
    });
  });

  describe('GET /api/v1/block/:identifier', () => {
    it('should return block data for valid identifier in DEXTools format', async () => {
      const res = await request(app)
        .get('/api/v1/block/12345')
        .expect(200);

      expect(res.body).toHaveProperty('block');
      expect(res.body.block).toHaveProperty('blockNumber');
      expect(res.body.block).toHaveProperty('blockTimestamp');
      expect(typeof res.body.block.blockNumber).toBe('number');
      expect(typeof res.body.block.blockTimestamp).toBe('number');
    });

    it('should return 400 for empty identifier', async () => {
      const res = await request(app)
        .get('/api/v1/block/')
        .expect(404);
    });

    it('should return 400 for invalid identifier', async () => {
      const res = await request(app)
        .get('/api/v1/block/invalid')
        .expect(400);

      expect(res.body).toHaveProperty('error');
    });
  });

  describe('GET /api/v1/asset/:assetId', () => {
    it('should return asset data for valid asset ID in DEXTools format', async () => {
      const res = await request(app)
        .get('/api/v1/asset/0x1234567890abcdef')
        .expect(200);

      expect(res.body).toHaveProperty('asset');
      expect(res.body.asset).toHaveProperty('id');
      expect(res.body.asset).toHaveProperty('symbol');
      expect(res.body.asset).toHaveProperty('name');
      expect(res.body.asset).toHaveProperty('decimals');
    });

    it('should return 400 for empty asset ID', async () => {
      const res = await request(app)
        .get('/api/v1/asset/')
        .expect(404);
    });
  });

  describe('GET /api/v1/exchange/:exchangeId', () => {
    it('should return exchange data for valid exchange ID in DEXTools format', async () => {
      const res = await request(app)
        .get('/api/v1/exchange/0x1234567890abcdef')
        .expect(200);

      expect(res.body).toHaveProperty('exchange');
      expect(res.body.exchange).toHaveProperty('id');
      expect(res.body.exchange).toHaveProperty('name');
      expect(res.body.exchange).toHaveProperty('factoryAddress');
    });
  });

  describe('GET /api/v1/pair/:pairId', () => {
    it('should return pair data for valid pair ID in DEXTools format', async () => {
      const res = await request(app)
        .get('/api/v1/pair/pair123')
        .expect(200);

      expect(res.body).toHaveProperty('pair');
      expect(res.body.pair).toHaveProperty('id');
      expect(res.body.pair).toHaveProperty('token0');
      expect(res.body.pair).toHaveProperty('token1');
      expect(res.body.pair).toHaveProperty('reserve0');
      expect(res.body.pair).toHaveProperty('reserve1');
    });
  });

  describe('GET /api/v1/events', () => {
    it('should return events data in DEXTools format', async () => {
      const res = await request(app)
        .get('/api/v1/events')
        .expect(200);

      expect(res.body).toHaveProperty('events');
      expect(res.body).toHaveProperty('total');
      expect(res.body).toHaveProperty('page');
      expect(res.body).toHaveProperty('limit');
      expect(res.body).toHaveProperty('hasMore');
      expect(Array.isArray(res.body.events)).toBe(true);
    });

    it('should return events with query parameters', async () => {
      const res = await request(app)
        .get('/api/v1/events?page=1&limit=50&type=swap')
        .expect(200);

      expect(res.body).toHaveProperty('events');
      expect(res.body).toHaveProperty('total');
      expect(res.body).toHaveProperty('page');
      expect(res.body).toHaveProperty('limit');
      expect(Array.isArray(res.body.events)).toBe(true);
    });

    it('should return 400 for invalid query parameters', async () => {
      const res = await request(app)
        .get('/api/v1/events?invalidParam=test')
        .expect(400);

      expect(res.body).toHaveProperty('error');
    });
  });

  describe('GET /api/v1/docs', () => {
    it('should return API documentation', async () => {
      const res = await request(app)
        .get('/api/v1/docs')
        .expect(200);

      expect(res.body).toHaveProperty('title');
      expect(res.body).toHaveProperty('version');
      expect(res.body).toHaveProperty('endpoints');
      expect(Array.isArray(res.body.endpoints)).toBe(true);
    });
  });
});
