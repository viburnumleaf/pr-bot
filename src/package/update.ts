import type { PackageUpdateResult, DependencySection, MultiPackageUpdateResult } from '../types/package';
import { PackageError } from '../errors';
import { DIFF_CONTEXT } from '../constants';

type PackageJsonStructure = {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

// Updates a dependency version in package.json content
export const updatePackageJsonContent = (
  content: string,
  packageName: string,
  version: string
): { updated: boolean; newContent: string; updatedIn: DependencySection | null } => {
  let packageJson: PackageJsonStructure;
  
  try {
    packageJson = JSON.parse(content) as PackageJsonStructure;
  } catch (error) {
    throw new PackageError(`Invalid JSON in package.json: ${error instanceof Error ? error.message : String(error)}`);
  }
  
  let updatedIn: DependencySection | null = null;
  
  if (packageJson.dependencies?.[packageName]) {
    updatedIn = 'dependencies';
    packageJson.dependencies[packageName] = version;
  } else if (packageJson.devDependencies?.[packageName]) {
    updatedIn = 'devDependencies';
    packageJson.devDependencies[packageName] = version;
  } else {
    // TODO: Add support for peerDependencies and optionalDependencies
    return { updated: false, newContent: content, updatedIn: null };
  }
  
  const newContent = JSON.stringify(packageJson, null, 2) + '\n';
  return { updated: true, newContent, updatedIn };
};

// Generates a simple diff showing the changed line with context
export const generateDiff = (original: string, updated: string, filePath: string): string => {
  const originalLines = original.split('\n');
  const updatedLines = updated.split('\n');
  
  const diff: string[] = [
    `--- ${filePath} (original)`,
    `+++ ${filePath} (updated)`,
    '',
  ];
  
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
  
  // Show context around the change
  const start = Math.max(0, changedIndex - DIFF_CONTEXT.LINES_BEFORE);
  const end = Math.min(maxLength, changedIndex + DIFF_CONTEXT.LINES_AFTER + 1);
  
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

export type PackageFileUpdate = {
  path: string;
  content: string;
  updatedIn: DependencySection;
  diff: string;
};

// Updates multiple package.json files and returns updates
export const updateMultiplePackageJson = (
  packageJsonFiles: Array<{ path: string; content: string }>,
  packageName: string,
  version: string
): MultiPackageUpdateResult => {
  const results: PackageUpdateResult[] = [];
  
  for (const file of packageJsonFiles) {
    const { updated, newContent, updatedIn } = updatePackageJsonContent(
      file.content,
      packageName,
      version
    );
    
    if (updated && updatedIn) {
      const diff = generateDiff(file.content, newContent, file.path);
      results.push({
        updated: true,
        diff,
        packageJsonPath: file.path,
        updatedIn,
      });
    }
  }
  
  if (results.length === 0) {
    const searchedFiles = packageJsonFiles.map(f => f.path).join(', ');
    throw new PackageError(
      `Dependency "${packageName}" not found in any package.json files. ` +
      `Searched ${packageJsonFiles.length} file(s): ${searchedFiles}`
    );
  }
  
  return {
    updated: true,
    results,
    totalUpdated: results.length,
  };
};
