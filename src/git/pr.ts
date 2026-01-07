import { Octokit } from '@octokit/rest';
import { getGitHubToken } from './auth';
import { GitHubClient } from '../services/github-client';
import { generateCommitMessage, generatePRTitle } from '../utils/pr-validation';
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
const createGitHubClient = (): GitHubClient => {
  const token = getGitHubToken();
  const octokit = new Octokit({ auth: token });
  return new GitHubClient(octokit);
};

// Commits changes and creates a pull request
export const createPullRequest = async (
  repoFullName: string,
  branchName: string,
  baseBranch: string,
  packageName: string,
  version: string,
  fileUpdates: PackageFileUpdate[]
): Promise<PullRequestResult> => {
  const { owner, repo } = parseRepository(repoFullName);
  const client = createGitHubClient();

  // Get file contents and update them
  const commitMessage = generateCommitMessage(packageName, version);
  
  for (const fileUpdate of fileUpdates) {
    const { sha } = await client.getFileContent(
      owner,
      repo,
      fileUpdate.path,
      branchName
    );

    await client.updateFileContent(
      owner,
      repo,
      fileUpdate.path,
      fileUpdate.content,
      sha,
      branchName,
      commitMessage
    );
  }

  // Create pull request
  const prTitle = generatePRTitle(packageName, version);
  const pr = await client.createPullRequest(owner, repo, {
    title: prTitle,
    head: branchName,
    base: baseBranch,
    body: `This PR updates \`${packageName}\` to version \`${version}\`.`,
  });

  return {
    prUrl: pr.html_url,
    prNumber: pr.number,
  };
};
