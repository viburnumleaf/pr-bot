import dotenv from 'dotenv';
import { envSchema } from '../schemas/env';
import { parseOrExit } from '../utils/validation';

dotenv.config({ path: '.env.local' });

// Gets and validates GitHub token from environment variables
// Checks if the provided repository matches GITHUB_NAME from env
// @param repoFullName - Repository in format "owner/name" that must match GITHUB_NAME
export const getGitHubToken = (repoFullName: string): string => {
  const env = parseOrExit(envSchema, process.env, 'Invalid environment variables');
  
  // Check if repository matches the configured GITHUB_NAME
  if (repoFullName !== env.GITHUB_NAME) {
    throw new Error(
      `Repository "${repoFullName}" does not match configured repository "${env.GITHUB_NAME}". ` +
      `Update GITHUB_NAME in .env.local to match the repository you want to use.`
    );
  }
  
  return env.GITHUB_TOKEN;
};
