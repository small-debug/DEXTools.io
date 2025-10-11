const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Default error
  let error = {
    message: err.message || 'Internal Server Error',
    status: err.status || 500,
    code: 'INTERNAL_ERROR'
  };

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const issues = Object.values(err.errors).map(val => ({
      param: val.path,
      message: val.message
    }));
    error = {
      message: 'Validation failed',
      status: 400,
      code: 'VALIDATION_ERROR',
      issues
    };
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    error = {
      message: 'Duplicate field value entered',
      status: 400,
      code: 'DUPLICATE_ERROR',
      issues: [{
        message: 'Duplicate field value entered'
      }]
    };
  }

  // Mongoose cast error
  if (err.name === 'CastError') {
    error = {
      message: 'Resource not found',
      status: 404,
      code: 'NOT_FOUND',
      issues: [{
        message: 'Resource not found'
      }]
    };
  }

  // Qubic RPC error
  if (err.name === 'QubicRpcError') {
    const status = err.status || 502;
    let code = 'RPC_ERROR';
    
    if (status === 404) {
      code = 'NOT_FOUND';
    } else if (status === 400) {
      code = 'BAD_REQUEST';
    } else if (status === 429) {
      code = 'TOO_MANY_REQUESTS';
    } else if (status >= 500) {
      code = 'INTERNAL_ERROR';
    }

    error = {
      message: err.message,
      status,
      code,
      issues: [{
        message: err.message
      }]
    };
  }

  // Rate limiting error
  if (err.status === 429) {
    error = {
      message: 'Too many requests',
      status: 429,
      code: 'TOO_MANY_REQUESTS',
      issues: [{
        message: 'Too many requests'
      }]
    };
  }

  // Not found error
  if (err.name === 'NotFoundError') {
    error = {
      message: 'Not Found',
      status: 404,
      code: 'NOT_FOUND',
      issues: [{
        message: 'The requested resource was not found'
      }]
    };
  }

  // Build response according to DEXTools schema
  const response = {
    code: error.code,
    message: error.message
  };

  if (error.issues) {
    response.issues = error.issues;
  }

  // Add stack trace in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(error.status).json(response);
};

const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.status = 404;
  error.name = 'NotFoundError';
  next(error);
};

module.exports = {
  errorHandler,
  notFound
};
