import { getDefaultBranch, createBranch } from '../git/repo';

export const setupBranch = async (
  repo: string,
  branchName: string
): Promise<string> => {
  const baseBranch = await getDefaultBranch(repo);
  console.log(`✅ Default branch: ${baseBranch}`);
  
  await createBranch(repo, branchName, baseBranch);
  console.log(`✅ Branch created: ${branchName}`);
  
  return baseBranch;
};
