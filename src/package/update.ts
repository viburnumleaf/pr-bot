import fs from 'fs/promises';
import type { PackageUpdateResult, DependencySection, MultiPackageUpdateResult } from '../types/package';
import type { PackageJsonLocation } from '../types/workspace';

// Updates a dependency version in a single package.json file
export const updatePackageJson = async (
  packageJsonPath: string,
  packageName: string,
  version: string
): Promise<PackageUpdateResult | null> => {
  const content = await fs.readFile(packageJsonPath, 'utf-8');
  const packageJson = JSON.parse(content) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };
  const originalContent = content;
  
  // Find which section contains the package
  let updatedIn: DependencySection | null = null;
  if (packageJson.dependencies?.[packageName]) {
    updatedIn = 'dependencies';
    packageJson.dependencies[packageName] = version;
  } else if (packageJson.devDependencies?.[packageName]) {
    updatedIn = 'devDependencies';
    packageJson.devDependencies[packageName] = version;
  } else {
    // Package not found in this package.json, return null
    return null;
  }
  
  const updatedContent = JSON.stringify(packageJson, null, 2) + '\n';
  await fs.writeFile(packageJsonPath, updatedContent, 'utf-8');
  
  const diff = generateDiff(originalContent, updatedContent, packageJsonPath);
  
  return { updated: true, diff, packageJsonPath, updatedIn };
};

// Updates a dependency version in multiple package.json files (monorepo)
export const updateMultiplePackageJson = async (
  repoPath: string,
  packageJsonLocations: PackageJsonLocation[],
  packageName: string,
  version: string
): Promise<MultiPackageUpdateResult> => {
  const results: PackageUpdateResult[] = [];
  
  for (const location of packageJsonLocations) {
    const result = await updatePackageJson(location.path, packageName, version);
    if (result) {
      results.push(result);
    }
  }
  
  if (results.length === 0) {
    throw new Error(
      `❌ Dependency "${packageName}" not found in any package.json files. ` +
      `Searched ${packageJsonLocations.length} file(s): ${packageJsonLocations.map(l => l.relativePath).join(', ')}`
    );
  }
  
  return {
    updated: true,
    results,
    totalUpdated: results.length
  };
};

// Generates a simple diff showing the changed line
const generateDiff = (original: string, updated: string, filePath: string): string => {
  const originalLines = original.split('\n');
  const updatedLines = updated.split('\n');
  
  const diff: string[] = [`--- ${filePath} (original)`, `+++ ${filePath} (updated)`, ''];
  
  // Find the first changed line
  const maxLength = Math.max(originalLines.length, updatedLines.length);
  let changedIndex = -1;
  
  for (let i = 0; i < maxLength; i++) {
    if (originalLines[i] !== updatedLines[i]) {
      changedIndex = i;
      break;
    }
  }
  
  if (changedIndex === -1) {
    return diff.join('\n');
  }
  
  // Show context around the change (2 lines before and after)
  const start = Math.max(0, changedIndex - 2);
  const end = Math.min(maxLength, changedIndex + 3);
  
  for (let i = start; i < end; i++) {
    if (i === changedIndex) {
      if (originalLines[i]) diff.push(`-${originalLines[i]}`);
      if (updatedLines[i]) diff.push(`+${updatedLines[i]}`);
    } else {
      const line = originalLines[i] || updatedLines[i];
      if (line !== undefined) {
        diff.push(` ${line}`);
      }
    }
  }
  
  return diff.join('\n');
};
