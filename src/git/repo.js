import simpleGit from 'simple-git';
import os from 'os';
import path from 'path';
import fs from 'fs/promises';
import { getGitHubToken } from './auth.js';

export const cloneRepo = async (repoFullName, branchName) => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'pr-bot-'));
  const git = simpleGit();

  const repoUrl = `https://<token>@github.com/${repoFullName}.git`.replace('<token>', getGitHubToken());

  console.log(`Cloning ${repoFullName} into ${tmpDir}...`);
  await git.clone(repoUrl, tmpDir);

  const repoGit = simpleGit(tmpDir);
  console.log(`Checking out new branch: ${branchName}`);
  await repoGit.checkoutLocalBranch(branchName);

  return tmpDir;
}
