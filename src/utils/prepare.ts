import { parseArgs } from '../cli/parseArgs';
import { getGitHubToken } from '../git/auth';
import type { CliOptions } from '../schemas/cli';

// Prepares and validates CLI options and environment
export const prepare = (): CliOptions => {
  const options = parseArgs();
  // Validate token is present
  getGitHubToken();
  return options;
};
