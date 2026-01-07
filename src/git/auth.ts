import dotenv from 'dotenv';
import { envSchema } from '../schemas/env';
import { parseOrExit } from '../utils/validation';

dotenv.config({ path: '.env.local' });

type GitHubRepoConfig = {
  GITHUB_NAME: string;
  GITHUB_TOKEN: string;
};

// Array of repository configurations with name and token
// Currently contains one object from environment variables
// TODO: Add more repositories to the array as needed from Database or API
const getGitHubRepos = (): GitHubRepoConfig[] => {
  const env = parseOrExit(envSchema, process.env, 'Invalid environment variables');
  
  return [
    {
      GITHUB_NAME: env.GITHUB_NAME,
      GITHUB_TOKEN: env.GITHUB_TOKEN,
    },
  ];
};

// Gets and validates GitHub token from environment variables
// Checks if the provided repository matches GITHUB_NAME from the repos array
export const getGitHubToken = (repoFullName: string): string => {
  const repos = getGitHubRepos();
  
  // Find repository configuration that matches the requested repo
  const repoConfig = repos.find(repo => repo.GITHUB_NAME === repoFullName);
  
  if (!repoConfig) {
    const availableRepos = repos.map(r => r.GITHUB_NAME).join(', ');
    throw new Error(
      `Repository "${repoFullName}" not found in configuration. ` +
      `Available repositories: ${availableRepos || 'none'}. ` +
      `Update GITHUB_NAME in .env.local to match the repository you want to use.`
    );
  }
  
  return repoConfig.GITHUB_TOKEN;
};
