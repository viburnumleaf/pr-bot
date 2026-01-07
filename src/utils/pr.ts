import { Octokit } from '@octokit/rest';
import { createPullRequest } from '../git/pr';
import { checkExistingPR } from './pr-validation';
import { getGitHubToken } from '../git/auth';
import { GitHubClient } from '../services/github-client';
import { logger } from '../services/logger';
import { RepositoryError } from '../errors';
import type { PullRequestResult } from '../types/github';
import type { PackageFileUpdate } from '../package/update';

// Parses repository full name into owner and repo
const parseRepository = (repoFullName: string): { owner: string; repo: string } => {
  const parts = repoFullName.split('/');
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    throw new RepositoryError(
      `Invalid repository format: ${repoFullName}. Expected format: owner/repo`
    );
  }
  return { owner: parts[0], repo: parts[1] };
};

// Creates a GitHub client instance
const createGitHubClient = (repoFullName: string): GitHubClient => {
  const token = getGitHubToken(repoFullName);
  const octokit = new Octokit({ auth: token });
  return new GitHubClient(octokit);
};

// Creates a pull request, checking for duplicates first
export const createPR = async (
  repo: string,
  branchName: string,
  baseBranch: string,
  packageName: string,
  version: string,
  fileUpdates: PackageFileUpdate[]
): Promise<PullRequestResult> => {
  const { owner, repo: repoName } = parseRepository(repo);
  const client = createGitHubClient(repo);

  // Check for existing PR
  logger.info(`Checking for existing PRs for ${packageName}@${version}...`);
  const existingPR = await checkExistingPR(
    client,
    owner,
    repoName,
    packageName,
    version,
    baseBranch
  );

  if (existingPR.exists && existingPR.prNumber && existingPR.prUrl) {
    logger.warn(`PR already exists for ${packageName}@${version}`);
    logger.info(`PR #${existingPR.prNumber}: ${existingPR.prUrl}`);
    logger.info('Skipping PR creation to avoid duplicates.');
    return {
      prUrl: existingPR.prUrl,
      prNumber: existingPR.prNumber,
    };
  }

  logger.info('No existing PR found, proceeding with creation...');

  const pr = await createPullRequest(
    repo,
    branchName,
    baseBranch,
    packageName,
    version,
    fileUpdates
  );
  logger.info(`Pull request created: ${pr.prUrl}`);
  return pr;
};
