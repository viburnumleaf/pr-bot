import { cloneRepo } from '../git/repo.js';

export const setupRepository = async (repo, branchName) => {
  const repoPath = await cloneRepo(repo, branchName);
  console.log('✅ Repository cloned and new branch created:');
  console.log(`Path: ${repoPath}`);
  console.log(`Branch: ${branchName}`);
  return repoPath;
};
