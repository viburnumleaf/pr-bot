import { updateMultiplePackageJson } from '../package/update';
import { findPackageJsonFiles, detectWorkspaceType } from './workspace';
import { WorkspaceType } from '../types/workspace';
import type { MultiPackageUpdateResult } from '../types/package';
import type { CliOptions } from '../types/cli';

export const updateDependency = async (
  repoPath: string,
  packageName: string,
  version: string,
  options: CliOptions
): Promise<MultiPackageUpdateResult> => {
  // Detect workspace type
  const workspaceType = await detectWorkspaceType(repoPath);
  if (workspaceType !== WorkspaceType.NONE) {
    console.log(`\n📦 Detected ${workspaceType.toUpperCase()} workspace`);
  }
  
  // Find all package.json files
  const packageJsonLocations = await findPackageJsonFiles(repoPath, options.path);
  
  if (packageJsonLocations.length === 0) {
    throw new Error('❌ No package.json files found in the repository');
  }
  
  console.log(`\n🔍 Found ${packageJsonLocations.length} package.json file(s):`);
  packageJsonLocations.forEach(loc => {
    console.log(`   - ${loc.relativePath}`);
  });
  
  // Update all package.json files
  const result = await updateMultiplePackageJson(repoPath, packageJsonLocations, packageName, version);
  
  console.log(`\n✅ Updated ${packageName} to ${version} in ${result.totalUpdated} file(s):`);
  result.results.forEach(r => {
    console.log(`   - ${r.packageJsonPath} (${r.updatedIn})`);
  });
  
  console.log(`\n📝 File diff(s):\n`);
  result.results.forEach(r => {
    console.log(r.diff);
    console.log('');
  });
  
  return result;
};
