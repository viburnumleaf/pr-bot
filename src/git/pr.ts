import { Octokit } from '@octokit/rest';
import { getGitHubToken } from './auth';
import type { PullRequestResult } from '../types/github';
import type { PackageFileUpdate } from '../package/update';

// Gets file content from GitHub
const getFileContent = async (
  octokit: Octokit,
  owner: string,
  repo: string,
  path: string,
  branch: string
): Promise<{ content: string; sha: string }> => {
  try {
    const { data } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path,
      ref: branch
    });

    if (Array.isArray(data) || data.type !== 'file') {
      throw new Error(`Path ${path} is not a file`);
    }

    const content = Buffer.from(data.content, 'base64').toString('utf-8');
    return { content, sha: data.sha };
  } catch (error) {
    if (error instanceof Error && error.message.includes('404')) {
      throw new Error(`File ${path} not found in repository`);
    }
    throw error;
  }
};

// Updates file content on GitHub
const updateFileContent = async (
  octokit: Octokit,
  owner: string,
  repo: string,
  path: string,
  content: string,
  sha: string,
  branch: string,
  message: string
): Promise<void> => {
  const encodedContent = Buffer.from(content).toString('base64');

  await octokit.rest.repos.createOrUpdateFileContents({
    owner,
    repo,
    path,
    message,
    content: encodedContent,
    sha,
    branch
  });
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
  const [owner, repo] = repoFullName.split('/');
  const token = getGitHubToken();
  const octokit = new Octokit({ auth: token });

  // Get file contents and update them
  for (const fileUpdate of fileUpdates) {
    const { content: currentContent, sha } = await getFileContent(
      octokit,
      owner,
      repo,
      fileUpdate.path,
      branchName
    );

    await updateFileContent(
      octokit,
      owner,
      repo,
      fileUpdate.path,
      fileUpdate.content,
      sha,
      branchName,
      `chore: bump ${packageName} to ${version}`
    );
  }

  // Create pull request
  const { data: pr } = await octokit.rest.pulls.create({
    owner,
    repo,
    title: `chore: bump ${packageName} to ${version}`,
    head: branchName,
    base: baseBranch,
    body: `This PR updates \`${packageName}\` to version \`${version}\`.`
  });

  return {
    prUrl: pr.html_url,
    prNumber: pr.number
  };
};
