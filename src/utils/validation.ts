import { z } from 'zod';

// Helper function to parse and validate with Zod schema
export const parseOrExit = <T>(schema: z.ZodSchema<T>, data: unknown, errorPrefix: string): T => {
  const result = schema.safeParse(data);
  
  if (!result.success) {
    console.error(`❌ ${errorPrefix}:`);
    result.error.issues.forEach((issue) => {
      const path = issue.path.length > 0 ? issue.path.join('.') : 'root';
      console.error(`   - ${path}: ${issue.message}`);
    });
    process.exit(1);
  }
  
  return result.data;
};
