import { createPullRequest } from '../git/pr';
import type { PullRequestResult } from '../types/github';
import type { PackageFileUpdate } from '../package/update';

export const createPR = async (
  repo: string,
  branchName: string,
  baseBranch: string,
  packageName: string,
  version: string,
  fileUpdates: PackageFileUpdate[]
): Promise<PullRequestResult> => {
  const pr = await createPullRequest(
    repo,
    branchName,
    baseBranch,
    packageName,
    version,
    fileUpdates
  );
  console.log(`\n✅ Pull request created: ${pr.prUrl}`);
  return pr;
};
