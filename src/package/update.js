import fs from 'fs/promises';
import path from 'path';

/**
 * Updates a dependency version in package.json
 * @param {string} repoPath - Path to the cloned repository
 * @param {string} packageName - Name of the package to update
 * @param {string} version - Target version
 * @returns {Promise<{updated: boolean, diff: string, packageJsonPath: string, updatedIn: string}>}
 */
export const updatePackageJson = async (repoPath, packageName, version) => {
  const packageJsonPath = path.join(repoPath, 'package.json');
  
  const content = await fs.readFile(packageJsonPath, 'utf-8');
  const packageJson = JSON.parse(content);
  const originalContent = content;
  
  // Find which section contains the package
  let updatedIn = null;
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
const generateDiff = (original, updated, filePath) => {
  const originalLines = original.split('\n');
  const updatedLines = updated.split('\n');
  
  const diff = [`--- ${filePath} (original)`, `+++ ${filePath} (updated)`, ''];
  
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
