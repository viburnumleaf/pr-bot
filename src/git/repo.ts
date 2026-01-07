import { Octokit } from '@octokit/rest';
import { getGitHubToken } from './auth';

export const getDefaultBranch = async (repoFullName: string): Promise<string> => {
  const [owner, repo] = repoFullName.split('/');
  const token = getGitHubToken();
  const octokit = new Octokit({ auth: token });

  const { data } = await octokit.rest.repos.get({ owner, repo });
  return data.default_branch;
};

export const createBranch = async (
  repoFullName: string,
  branchName: string,
  baseBranch: string
): Promise<void> => {
  const [owner, repo] = repoFullName.split('/');
  const token = getGitHubToken();
  const octokit = new Octokit({ auth: token });

  // Get the SHA of the base branch
  const { data: refData } = await octokit.rest.git.getRef({
    owner,
    repo,
    ref: `heads/${baseBranch}`
  });

  // Create new branch from base branch
  await octokit.rest.git.createRef({
    owner,
    repo,
    ref: `refs/heads/${branchName}`,
    sha: refData.object.sha
  });
};
