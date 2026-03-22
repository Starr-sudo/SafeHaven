/**
 * Input Validation Middleware
 * Uses Zod schemas to validate request bodies
 */

const validate = (schema) => {
  return (req, res, next) => {
    try {
      const validatedData = schema.parse(req.body);
      req.body = validatedData;
      next();
    } catch (error) {
      const errors = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }));
      
      return res.status(400).json({
        error: 'Validation failed',
        details: errors
      });
    }
  };
};

module.exports = validate;