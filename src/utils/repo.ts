import { cloneRepo } from '../git/repo';

export const setupRepository = async (repo: string, branchName: string): Promise<string> => {
  const repoPath = await cloneRepo(repo, branchName);
  console.log('✅ Repository cloned and new branch created:');
  console.log(`Path: ${repoPath}`);
  console.log(`Branch: ${branchName}`);
  return repoPath;
};
