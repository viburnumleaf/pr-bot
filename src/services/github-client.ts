// GitHub API client service with centralized error handling

import { Octokit } from '@octokit/rest';
import { GitHubError, FileNotFoundError } from '../errors';
import { logger } from './logger';

export type GitHubFileContent = {
  content: string;
  sha: string;
};

export type GitHubFileInfo = {
  path: string;
  sha: string;
  type: string;
}

export class GitHubClient {
  constructor(private readonly octokit: Octokit) {}

  // TODO: Add rate limiting handling with exponential backoff retry logic
  // Gets file content from GitHub repository
  async getFileContent(
    owner: string,
    repo: string,
    path: string,
    branch: string
  ): Promise<GitHubFileContent> {
    try {
      const { data } = await this.octokit.rest.repos.getContent({
        owner,
        repo,
        path,
        ref: branch,
      });

      if (Array.isArray(data) || data.type !== 'file') {
        throw new GitHubError(`Path ${path} is not a file`);
      }

      const content = Buffer.from(data.content, 'base64').toString('utf-8');
      return { content, sha: data.sha };
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        throw new FileNotFoundError(path, error);
      }
      throw new GitHubError(`Failed to get file content: ${path}`, error);
    }
  }

  // Updates file content on GitHub
  async updateFileContent(
    owner: string,
    repo: string,
    path: string,
    content: string,
    sha: string,
    branch: string,
    message: string
  ): Promise<void> {
    try {
      const encodedContent = Buffer.from(content).toString('base64');

      await this.octokit.rest.repos.createOrUpdateFileContents({
        owner,
        repo,
        path,
        message,
        content: encodedContent,
        sha,
        branch,
      });
    } catch (error) {
      throw new GitHubError(`Failed to update file: ${path}`, error);
    }
  }

  // Checks if a file exists in the repository
  async fileExists(
    owner: string,
    repo: string,
    path: string,
    branch: string
  ): Promise<boolean> {
    try {
      await this.octokit.rest.repos.getContent({
        owner,
        repo,
        path,
        ref: branch,
      });
      return true;
    } catch {
      return false;
    }
  }

  // Gets repository information
  async getRepository(owner: string, repo: string) {
    try {
      const { data } = await this.octokit.rest.repos.get({ owner, repo });
      return data;
    } catch (error) {
      throw new GitHubError(`Failed to get repository: ${owner}/${repo}`, error);
    }
  }

  // Gets default branch of a repository
  async getDefaultBranch(owner: string, repo: string): Promise<string> {
    try {
      const repoData = await this.getRepository(owner, repo);
      return repoData.default_branch;
    } catch (error) {
      throw new GitHubError(
        `Failed to get default branch for ${owner}/${repo}`,
        error
      );
    }
  }

  // Creates a new branch from a base branch
  async createBranch(
    owner: string,
    repo: string,
    branchName: string,
    baseBranch: string
  ): Promise<void> {
    try {
      const { data: refData } = await this.octokit.rest.git.getRef({
        owner,
        repo,
        ref: `heads/${baseBranch}`,
      });

      await this.octokit.rest.git.createRef({
        owner,
        repo,
        ref: `refs/heads/${branchName}`,
        sha: refData.object.sha,
      });
    } catch (error) {
      throw new GitHubError(
        `Failed to create branch: ${branchName} from ${baseBranch}`,
        error
      );
    }
  }

  // Lists pull requests
  async listPullRequests(
    owner: string,
    repo: string,
    options: {
      state?: 'open' | 'closed' | 'all';
      base?: string;
      perPage?: number;
    } = {}
  ) {
    try {
      const { data } = await this.octokit.rest.pulls.list({
        owner,
        repo,
        state: options.state ?? 'open',
        base: options.base,
        per_page: options.perPage ?? 100,
      });
      return data;
    } catch (error) {
      logger.warn('Failed to list pull requests', error);
      throw new GitHubError('Failed to list pull requests', error);
    }
  }

  // Lists files in a pull request
  async listPullRequestFiles(
    owner: string,
    repo: string,
    pullNumber: number
  ) {
    try {
      const { data } = await this.octokit.rest.pulls.listFiles({
        owner,
        repo,
        pull_number: pullNumber,
      });
      return data;
    } catch (error) {
      throw new GitHubError(
        `Failed to list files for PR #${pullNumber}`,
        error
      );
    }
  }

  // Creates a pull request
  async createPullRequest(
    owner: string,
    repo: string,
    options: {
      title: string;
      head: string;
      base: string;
      body: string;
    }
  ) {
    try {
      const { data } = await this.octokit.rest.pulls.create({
        owner,
        repo,
        title: options.title,
        head: options.head,
        base: options.base,
        body: options.body,
      });
      return data;
    } catch (error) {
      throw new GitHubError('Failed to create pull request', error);
    }
  }

  // Gets directory content
  async getDirectoryContent(
    owner: string,
    repo: string,
    path: string,
    branch: string
  ) {
    try {
      const { data } = await this.octokit.rest.repos.getContent({
        owner,
        repo,
        path,
        ref: branch,
      });

      if (!Array.isArray(data)) {
        throw new GitHubError(`Path ${path} is not a directory`);
      }

      return data;
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        throw new FileNotFoundError(path, error);
      }
      throw new GitHubError(`Failed to get directory content: ${path}`, error);
    }
  }
}
