import fs from 'fs/promises';
import path from 'path';
import type { PackageUpdateResult, DependencySection } from '../types/package';

/**
 * Updates a dependency version in package.json
 */
export const updatePackageJson = async (
  repoPath: string,
  packageName: string,
  version: string
): Promise<PackageUpdateResult> => {
  const packageJsonPath = path.join(repoPath, 'package.json');
  
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
    throw new Error(`❌ Dependency "${packageName}" not found in dependencies or devDependencies`);
  }
  
  const updatedContent = JSON.stringify(packageJson, null, 2) + '\n';
  await fs.writeFile(packageJsonPath, updatedContent, 'utf-8');
  
  const diff = generateDiff(originalContent, updatedContent, packageJsonPath);
  
  return { updated: true, diff, packageJsonPath, updatedIn };
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
