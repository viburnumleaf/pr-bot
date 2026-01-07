import { getDefaultBranch, createBranch } from '../git/repo';
import { logger } from '../services/logger';

// Sets up a new branch for the PR
// TODO: Handle branch name collisions (append number or timestamp if branch exists)
export const setupBranch = async (
  repo: string,
  branchName: string
): Promise<string> => {
  const baseBranch = await getDefaultBranch(repo);
  logger.info(`Default branch: ${baseBranch}`);
  
  await createBranch(repo, branchName, baseBranch);
  logger.info(`Branch created: ${branchName}`);
  
  return baseBranch;
};
