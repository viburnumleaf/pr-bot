import dotenv from 'dotenv';
import { envSchema } from '../schemas/env';
import { parseOrExit } from '../utils/validation';

dotenv.config({ path: '.env.local' });

// Gets and validates GitHub token from environment variables
// Token can be used for any repository the token has access to
export const getGitHubToken = (): string => {
  const env = parseOrExit(envSchema, process.env, 'Invalid environment variables');
  return env.GITHUB_TOKEN;
};
