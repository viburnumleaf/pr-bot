import dotenv from 'dotenv';
import { envSchema } from '../schemas/env';
import { parseOrExit } from '../utils/validation';

dotenv.config({ path: '.env.local' });

export const getGitHubToken = (): string => {
  const env = parseOrExit(envSchema, process.env, 'Invalid environment variables');
  return env.GITHUB_TOKEN;
};
