import { Octokit } from '@octokit/rest';
import simpleGit from 'simple-git';
import { getGitHubToken } from './auth.js';

/**
 * Commits changes, pushes branch and creates a pull request
 * @param {string} repoPath - Path to the cloned repository
 * @param {string} repoFullName - Repository full name (owner/name)
 * @param {string} branchName - Branch name
 * @param {string} packageName - Package name that was updated
 * @param {string} version - New version
 * @returns {Promise<{prUrl: string, prNumber: number}>}
 */
export const createPullRequest = async (repoPath, repoFullName, branchName, packageName, version) => {
  const [owner, repo] = repoFullName.split('/');
  const token = getGitHubToken();
  const octokit = new Octokit({ auth: token });
  
  // Configure git with environment variables for authentication
  const git = simpleGit(repoPath, {
    env: {
      ...process.env,
      GIT_ASKPASS: 'echo',
      GIT_TERMINAL_PROMPT: '0',
    }
  });

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
    if (error.message?.includes('403') || error.message?.includes('Permission')) {
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
