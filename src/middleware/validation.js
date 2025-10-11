const validateParams = (requiredParams) => {
  return (req, res, next) => {
    const missingParams = requiredParams.filter(param => !req.params[param]);
    
    if (missingParams.length > 0) {
      return res.status(400).json({
        error: `Missing required parameters: ${missingParams.join(', ')}`
      });
    }

    // Validate parameter formats
    for (const param of requiredParams) {
      const value = req.params[param];
      
      // Check for empty strings
      if (value === '') {
        return res.status(400).json({
          error: `Parameter '${param}' cannot be empty`
        });
      }

      // Additional validation based on parameter name
      if (param === 'identifier') {
        // Debug logging
        console.log(`🔍 Validating identifier: "${value}" (type: ${typeof value})`);
        console.log(`🔍 Regex test /^\\d+$/: ${/^\d+$/.test(value)}`);
        console.log(`🔍 Regex test /^\\d{10,13}$/: ${/^\d{10,13}$/.test(value)}`);
        
        // Block identifier should be numeric or valid timestamp
        if (!/^\d+$/.test(value) && !/^\d{10,13}$/.test(value)) {
          console.log(`❌ Validation failed for identifier: "${value}"`);
          return res.status(400).json({
            error: 'Block identifier must be a valid block number or timestamp'
          });
        }
        console.log(`✅ Validation passed for identifier: "${value}"`);
      }

      if (param === 'assetId' || param === 'exchangeId' || param === 'pairId') {
        // These should be non-empty strings
        if (typeof value !== 'string' || value.length < 1) {
          return res.status(400).json({
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            issues: [{
              param,
              message: `Parameter '${param}' must be a valid string`
            }]
          });
        }
      }
    }

    next();
  };
};

const validateQuery = (allowedParams) => {
  return (req, res, next) => {
    const queryParams = Object.keys(req.query);
    const invalidParams = queryParams.filter(param => !allowedParams.includes(param));
    
    if (invalidParams.length > 0) {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        issues: [{
          message: `Invalid query parameters: ${invalidParams.join(', ')}`
        }]
      });
    }

    // Validate numeric parameters
    const numericParams = ['page', 'limit', 'startTime', 'endTime'];
    for (const param of numericParams) {
      if (req.query[param] && isNaN(Number(req.query[param]))) {
        return res.status(400).json({
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          issues: [{
            param,
            message: `Parameter '${param}' must be a number`
          }]
        });
      }
    }

    // Validate page and limit ranges
    if (req.query.page && (Number(req.query.page) < 1)) {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        issues: [{
          param: 'page',
          message: 'Page number must be greater than 0'
        }]
      });
    }

    if (req.query.limit && (Number(req.query.limit) < 1 || Number(req.query.limit) > 1000)) {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        issues: [{
          param: 'limit',
          message: 'Limit must be between 1 and 1000'
        }]
      });
    }

    next();
  };
};

module.exports = {
  validateParams,
  validateQuery
};
