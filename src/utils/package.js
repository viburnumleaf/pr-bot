import { updatePackageJson } from '../package/update.js';

export const updateDependency = async (repoPath, packageName, version) => {
  const result = await updatePackageJson(repoPath, packageName, version);
  console.log(`\n✅ Updated ${packageName} to ${version} in ${result.updatedIn}`);
  console.log(`\n📝 File diff:\n`);
  console.log(result.diff);
  return result;
};
