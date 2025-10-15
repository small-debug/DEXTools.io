const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const qubicRoutes = require('./routes/qubic');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const eventsDataManager = require('./services/eventsDataManager');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/v1', qubicRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Initialize events data collection system
async function initializeServer() {
  try {
    console.log('🔄 Initializing server components...');
    
    // Start the server first (don't block on events collection)
    const server = app.listen(PORT, () => {
      console.log(`🚀 DEXTools Qubic API server running on port ${PORT}`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/api/v1/docs`);
      console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
      console.log(`📊 Events Collection: ${eventsDataManager.isRunning() ? 'ACTIVE' : 'DISABLED'}`);
    });
    
    // Initialize events data collection in background (non-blocking)
    if (process.env.ENABLE_EVENTS_COLLECTION !== 'false') {
      console.log('🔄 Starting events data collection in background...');
      eventsDataManager.initialize().catch(error => {
        console.error('❌ Events data collection failed to initialize:', error.message);
        console.log('⚠️  Server will continue running without events collection');
      });
    } else {
      console.log('⚠️  Events data collection disabled by environment variable');
    }
    
    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('🛑 SIGTERM received, shutting down gracefully...');
      server.close(() => {
        eventsDataManager.stop();
        console.log('✅ Server closed');
        process.exit(0);
      });
    });
    
    process.on('SIGINT', () => {
      console.log('🛑 SIGINT received, shutting down gracefully...');
      server.close(() => {
        eventsDataManager.stop();
        console.log('✅ Server closed');
        process.exit(0);
      });
    });
    
    return server;
    
  } catch (error) {
    console.error('❌ Failed to initialize server:', error.message);
    process.exit(1);
  }
}

// Start the server
initializeServer();

module.exports = app;
