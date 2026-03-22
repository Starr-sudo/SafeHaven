/**
 * Validation Middleware
 * Uses Zod schemas to validate request bodies
 */

const validate = (schema) => {
  return (req, res, next) => {
    try {
      // Validate the request body against the schema
      const validatedData = schema.parse(req.body);
      
      // Replace req.body with validated data
      req.body = validatedData;
      
      // Proceed to the next function
      next();
    } catch (error) {
      // Zod validation failed - send back error details
      const errors = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }));
      
      return res.status(400).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: errors
      });
    }
  };
};

module.exports = validate;