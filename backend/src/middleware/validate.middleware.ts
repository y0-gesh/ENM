import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';

/**
 * Validates incoming request body, query, or params against a Zod schema.
 */
export function validateRequest(schema: AnyZodObject) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      
      // Re-assign parsed inputs to request object to preserve typed objects (e.g. parsed strings as numbers)
      req.body = parsed.body || req.body;
      req.query = parsed.query || req.query;
      req.params = parsed.params || req.params;
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Invalid request input fields',
          code: 'VALIDATION_ERROR',
          errors: error.errors.map((err) => ({
            path: err.path.slice(1).join('.'), // drop first level ('body', 'query', 'params')
            message: err.message
          }))
        });
      }
      next(error);
    }
  };
}
