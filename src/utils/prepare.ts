import { parseArgs } from '../cli/parseArgs';
import { getGitHubToken } from '../git/auth';
import type { CliOptions } from '../types/cli';

export const prepare = (): CliOptions => {
  const options = parseArgs();
  getGitHubToken(); // validate token
  return options;
};
