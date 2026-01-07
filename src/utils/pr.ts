import { Octokit } from '@octokit/rest';
import { createPullRequest } from '../git/pr';
import { checkExistingPR } from './pr-validation';
import { getGitHubToken } from '../git/auth';
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
  const [owner, repoName] = repo.split('/');
  const token = getGitHubToken();
  const octokit = new Octokit({ auth: token });

  // Check for existing PR
  console.log(`\n🔍 Checking for existing PRs for ${packageName}@${version}...`);
  const existingPR = await checkExistingPR(octokit, owner, repoName, packageName, version, baseBranch);
  
  if (existingPR.exists) {
    console.log(`\n⚠️  PR already exists for ${packageName}@${version}:`);
    console.log(`   PR #${existingPR.prNumber}: ${existingPR.prUrl}`);
    console.log(`\n✅ Skipping PR creation to avoid duplicates.`);
    return {
      prUrl: existingPR.prUrl!,
      prNumber: existingPR.prNumber!
    };
  }
  
  console.log(`✅ No existing PR found, proceeding with creation...`);

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
