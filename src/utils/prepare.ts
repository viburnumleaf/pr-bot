import { parseArgs } from '../cli/parseArgs';
import { getGitHubToken } from '../git/auth';
import { logger } from '../services/logger';
import type { CliOptions } from '../schemas/cli';

// Prepares and validates CLI options and environment
export const prepare = (): CliOptions => {
  const options = parseArgs();
  // Validate token is present
  getGitHubToken();
  // Configure logger verbosity
  logger.setVerbose(options.verbose || false);
  return options;
};
