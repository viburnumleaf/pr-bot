import { z } from 'zod';

export const envSchema = z.object({
  GITHUB_TOKEN: z.string().min(1),
  GITHUB_NAME: z.string().min(1) // Repository name (owner/repo)
});

export type Env = z.infer<typeof envSchema>;
