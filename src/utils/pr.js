import { createPullRequest } from '../git/pr.js';

export const createPR = async (repoPath, repo, branchName, packageName, version) => {
  const pr = await createPullRequest(repoPath, repo, branchName, packageName, version);
  console.log(`\n✅ Pull request created: ${pr.prUrl}`);
  return pr;
};
