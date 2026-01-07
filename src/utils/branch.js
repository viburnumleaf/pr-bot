export const generateBranchName = (packageName, version) => {
  return `chore/bump-${packageName.replace('/', '-')}-${version}`;
};
