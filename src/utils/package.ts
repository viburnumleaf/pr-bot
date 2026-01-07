import { updatePackageJson } from '../package/update';
import type { PackageUpdateResult } from '../types/package';

export const updateDependency = async (
  repoPath: string,
  packageName: string,
  version: string
): Promise<PackageUpdateResult> => {
  const result = await updatePackageJson(repoPath, packageName, version);
  console.log(`\n✅ Updated ${packageName} to ${version} in ${result.updatedIn}`);
  console.log(`\n📝 File diff:\n`);
  console.log(result.diff);
  return result;
};
