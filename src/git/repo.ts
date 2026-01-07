import { Octokit } from '@octokit/rest';
import { getGitHubToken } from './auth';
import { GitHubClient } from '../services/github-client';
import { RepositoryError } from '../errors';

// Parses repository full name into owner and repo
// @throws {RepositoryError} if format is invalid
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

// Gets the default branch of a repository
// @throws {RepositoryError} if repository is invalid or inaccessible
export const getDefaultBranch = async (repoFullName: string): Promise<string> => {
  const { owner, repo } = parseRepository(repoFullName);
  const client = createGitHubClient(repoFullName);
  return await client.getDefaultBranch(owner, repo);
};

// Creates a new branch from a base branch
// @throws {RepositoryError} if branch creation fails
// TODO: Check if branch already exists and handle gracefully (skip or error)
export const createBranch = async (
  repoFullName: string,
  branchName: string,
  baseBranch: string
): Promise<void> => {
  const { owner, repo } = parseRepository(repoFullName);
  const client = createGitHubClient(repoFullName);
  await client.createBranch(owner, repo, branchName, baseBranch);
};
