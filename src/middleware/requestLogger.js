const requestLogger = (req, res, next) => {
  const start = Date.now();
  const originalSend = res.send;
  
  // Track response time
  res.send = function(data) {
    const duration = Date.now() - start;
    
    // Log high-frequency blockchain requests
    if (req.path === '/api/v1/latest-block' || req.path === '/api/v1/events') {
      console.log(`🚀 ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms - IP: ${req.ip}`);
      
      // Log if response is very fast (likely cached)
      if (duration < 50) {
        console.log(`⚡ Fast response (${duration}ms) - likely cached`);
      }
    }
    
    return originalSend.call(this, data);
  };
  
  next();
};

module.exports = requestLogger;
