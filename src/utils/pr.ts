import { createPullRequest } from '../git/pr';
import type { PullRequestResult } from '../types/github';

export const createPR = async (
  repoPath: string,
  repo: string,
  branchName: string,
  packageName: string,
  version: string
): Promise<PullRequestResult> => {
  const pr = await createPullRequest(repoPath, repo, branchName, packageName, version);
  console.log(`\n✅ Pull request created: ${pr.prUrl}`);
  return pr;
};
