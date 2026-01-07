import { z } from 'zod';
import { ValidationError } from '../errors';
import { logger } from '../services/logger';

// Parses and validates data with Zod schema
export const parseOrExit = <T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  errorPrefix: string
): T => {
  const result = schema.safeParse(data);
  
  if (!result.success) {
    const errors = result.error.issues.map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join('.') : 'root';
      return `${path}: ${issue.message}`;
    });
    
    const errorMessage = `${errorPrefix}\n${errors.map(e => `  - ${e}`).join('\n')}`;
    logger.error(errorMessage);
    throw new ValidationError(errorMessage, result.error);
  }
  
  return result.data;
};
