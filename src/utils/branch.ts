export const generateBranchName = (packageName: string, version: string): string => {
  return `chore/bump-${packageName.replace('/', '-')}-${version}`;
};
