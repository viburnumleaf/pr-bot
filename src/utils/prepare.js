import { parseArgs } from '../cli/parseArgs.js';
import { getGitHubToken } from '../git/auth.js';

export const prepare = () => {
  const options = parseArgs();
  getGitHubToken(); // validate token
  return options;
};
