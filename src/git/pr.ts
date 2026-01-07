import { Octokit } from '@octokit/rest';
import simpleGit from 'simple-git';
import { getGitHubToken } from './auth';
import type { PullRequestResult } from '../types/github';

/**
 * Commits changes, pushes branch and creates a pull request
 */
export const createPullRequest = async (
  repoPath: string,
  repoFullName: string,
  branchName: string,
  packageName: string,
  version: string
): Promise<PullRequestResult> => {
  const [owner, repo] = repoFullName.split('/');
  const token = getGitHubToken();
  const octokit = new Octokit({ auth: token });
  
  // Configure git with environment variables for authentication
  // Set environment variables before creating git instance
  process.env.GIT_ASKPASS = 'echo';
  process.env.GIT_TERMINAL_PROMPT = '0';
  
  const git = simpleGit(repoPath);

  // Configure git user
  await git.addConfig('user.name', 'PR Bot', false, 'local');
  await git.addConfig('user.email', 'pr-bot@example.com', false, 'local');

  // Commit changes
  await git.add('package.json');
  await git.commit(`chore: bump ${packageName} to ${version}`);

  // Push branch - ensure remote URL includes token
  const repoUrl = `https://${token}@github.com/${repoFullName}.git`;
  
  // Force update remote URL to include token
  await git.raw(['remote', 'set-url', 'origin', repoUrl]);
  
  try {
    await git.push(['-u', 'origin', branchName]);
  } catch (error) {
    // Check if it's a permission error
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('403') || errorMessage.includes('Permission')) {
      throw new Error(`Permission denied. Please check that your GITHUB_TOKEN has 'repo' scope and write access to ${repoFullName}`);
    }
    throw error;
  }

  // Create pull request
  const { data: pr } = await octokit.rest.pulls.create({
    owner,
    repo,
    title: `chore: bump ${packageName} to ${version}`,
    head: branchName,
    base: 'main',
    body: `This PR updates \`${packageName}\` to version \`${version}\`.`
  });

  return {
    prUrl: pr.html_url,
    prNumber: pr.number
  };
};
